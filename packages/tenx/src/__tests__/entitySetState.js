import tenx from "../lib";
import { entitySet } from "../extras";

let store;

beforeEach(() => {
  store = tenx({
    todos: entitySet([
      { id: 1, title: "item 1", completed: false },
      { id: 2, title: "item 2", completed: false },
      { id: 3, title: "item 3", completed: true },
    ]),
  });
});

test("create with initial value", () => {
  expect(store.todos).toEqual({
    ids: [1, 2, 3],
    entities: {
      1: { id: 1, title: "item 1", completed: false },
      2: { id: 2, title: "item 2", completed: false },
      3: { id: 3, title: "item 3", completed: true },
    },
  });
});

test("update using predicate", () => {
  store.dispatch(({ todos }) => {
    // toggle item which is not 1
    todos.update((todo) =>
      todo.id === 1 ? todo : { ...todo, completed: !todo.completed }
    );
  });
  expect(store.todos).toEqual({
    ids: [1, 2, 3],
    entities: {
      1: { id: 1, title: "item 1", completed: false },
      2: { id: 2, title: "item 2", completed: true },
      3: { id: 3, title: "item 3", completed: false },
    },
  });
});

test("updateIn", () => {
  store.dispatch(({ todos }) => {
    todos.updateIn(
      { id: 1, completed: (prev) => !prev },
      { id: 3, completed: false }
    );
  });
  expect(store.todos).toEqual({
    ids: [1, 2, 3],
    entities: {
      1: { id: 1, title: "item 1", completed: true },
      2: { id: 2, title: "item 2", completed: false },
      3: { id: 3, title: "item 3", completed: false },
    },
  });
});

test("toArray", () => {
  expect(store.todos.toArray()).toEqual([
    { id: 1, title: "item 1", completed: false },
    { id: 2, title: "item 2", completed: false },
    { id: 3, title: "item 3", completed: true },
  ]);
});

test("toArray(completed)", () => {
  expect(store.todos.toArray("completed")).toEqual([false, false, true]);
});

test("toMap(completed)", () => {
  expect(store.todos.toMap("completed")).toEqual({
    1: false,
    2: false,
    3: true,
  });
});
