import fetch from "node-fetch";
import { entity } from "../extras";
import delay from "../extras/delay";
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
        (todos) => ({ cache }) =>
          cache(
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

test("cancel last result", async () => {
  const callback = jest.fn();
  const store = tenx({
    count: 1,
    computed: {
      doubleCount: [
        "count",
        (count) => async ({ debounce }) => {
          await debounce(10);
          callback();
          return count * 2;
        },
      ],
    },
  });
  const increase = ({ count }) => count.value++;
  await expect(store.doubleCount).resolves.toBe(2);
  store.dispatch(increase);
  store.dispatch(increase);
  store.dispatch(increase);
  store.dispatch(increase);
  await expect(store.doubleCount).resolves.toBe(10);
  expect(callback).toBeCalledTimes(2);
});

test("movie list", async () => {
  const store = tenx({
    keyword: "Avenger",
    page: 1,
    computed: {
      // define computed prop presents movie search results
      // this prop fetches data automatically when keyword changed
      results: [
        "keyword",
        "page",
        (keyword, page) => async ({ debounce, cache }) => {
          if (!keyword) return { results: [] };
          await debounce(100);
          const res = await fetch(
            `https://api.themoviedb.org/3/search/movie?&api_key=04c35731a5ee918f014970082a0088b1&query=${encodeURIComponent(
              keyword
            )}&page=${page}`
          );
          const data = await res.json();
          return cache(data);
        },
      ],
    },
  });

  await expect(store.results).resolves.not.toBeUndefined();
});
