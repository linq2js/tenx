import { entity } from "../extras";
import shallowMemo from "../extras/shallowMemo";
import tenx from "../lib";

test("computed functional state", () => {
  const store = tenx({
    count: 1,
    computed: {
      doubleCount(state) {
        return state.count * 2;
      },
    },
  });

  expect(store.count).toBe(1);
  expect(store.doubleCount).toBe(2);
  store.dispatch(({ count, doubleCount }) => {
    count.value++;
    expect(doubleCount.value).toBe(4);
  });
  expect(store.doubleCount).toBe(4);
});

test("computed state depends on other state", () => {
  const store = tenx({
    numbers: [1, 2, 3, 4, 5, 6],
    type: "even",
    computed: {
      filteredNumbers: [
        "numbers",
        "type",
        function (numbers, type) {
          return type === "even"
            ? numbers.filter((x) => x % 2 === 0)
            : numbers.filter((x) => x % 2 !== 0);
        },
      ],
    },
  });

  expect(store.filteredNumbers).toEqual([2, 4, 6]);
  store.dispatch(({ type }) => (type.value = "odd"));
  expect(store.filteredNumbers).toEqual([1, 3, 5]);
});

test("shallow compare last result", () => {
  const store = tenx({
    todos: entity({
      1: { completed: true, title: "item 1" },
      2: { completed: false, title: "item 2" },
      3: { completed: true, title: "item 3" },
    }),
    computed: {
      completedStatuses: [
        "todos",
        (todos) => (old) =>
          shallowMemo(
            old,
            Object.keys(todos).reduce((obj, id) => {
              obj[id] = todos[id].completed;
              return obj;
            }, {})
          ),
      ],
    },
  });

  const originalCompletedStatuses = store.completedStatuses;
  store.dispatch(({ todos }) => todos.set("2.title", "new title"));
  expect(originalCompletedStatuses).toBe(store.completedStatuses);
  store.dispatch(({ todos }) => todos.set("3.completed", false));
  expect(store.completedStatuses).toEqual({ 1: true, 2: false, 3: false });
});
