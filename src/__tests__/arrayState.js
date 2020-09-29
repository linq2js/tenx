import { array } from "../extras";
import tenx from "../index";

let store;
const call = (method, ...args) => ({ todos }) => todos[method](...args);

beforeEach(() => {
  store = tenx({
    todos: array(),
  });
});

test("push", () => {
  const initial = store.todos;
  // push nothing
  store.dispatch(call("push"));

  expect(store.todos).toBe(initial);

  // push one
  store.dispatch(call("push", 1));

  expect(store.todos).toEqual([1]);
});

test("pop", () => {
  const initial = store.todos;
  // pop nothing
  expect(store.dispatch(call("pop"))).toBeUndefined();
  expect(store.todos).toBe(initial);

  store.dispatch(call("push", 1, 2, 3));
  expect(store.dispatch(call("pop"))).toBe(3);
  expect(store.todos).toEqual([1, 2]);
});

test("slice", () => {
  const initial = store.todos;
  // slice nothing
  expect(store.dispatch(call("slice"))).toBe(initial);
  store.dispatch(call("push", 1, 2, 3));
  expect(store.dispatch(call("slice", 0, 2))).toEqual([1, 2]);
  expect(store.todos).not.toBe(initial);
  expect(store.todos).toEqual([1, 2]);
});

test("orderBy", () => {
  const initial = store.todos;
  expect(store.dispatch(call("orderBy"))).toBe(initial);
  store.dispatch(call("push", 1, 2, 3));
  // same order
  expect(store.dispatch(call("orderBy"))).toEqual([1, 2, 3]);
  expect(store.todos).not.toBe(initial);
  // descending
  expect(store.dispatch(call("orderBy", -1))).toEqual([3, 2, 1]);
  expect(store.todos).not.toBe(initial);
});

test("splice", () => {
  const initial = store.todos;
  expect(store.dispatch(call("splice"))).toEqual([]);
  expect(store.todos).toBe(initial);
  store.dispatch(call("push", 1, 2, 3, 3, 4, 5));
  expect(store.dispatch(call("splice", 0, 2, 6))).toEqual([1, 2]);
  expect(store.todos).toEqual([6, 3, 3, 4, 5]);
  expect(
    store.dispatch(call("splice", 1, (value) => value % 2 === 1, 7, 8))
  ).toEqual([3, 3]);
  expect(store.todos).toEqual([6, 7, 8, 4, 5]);
});
