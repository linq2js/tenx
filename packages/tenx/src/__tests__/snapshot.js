import entitySetState from "../extras/entitySetState";
import snapshotStore from "../extras/snapshotStore";
import createStore from "../lib";

let store;
let snapshot;

function Update({ todos }, payload) {
  todos.update(payload);
}

beforeEach(() => {
  store = createStore({
    todos: entitySetState(),
  });
  snapshot = snapshotStore(store, "todos");
});

test("push", () => {
  store.dispatch(Update, { id: 1 });
  expect(snapshot.all).toEqual([
    { ids: [], entities: {} },
    { ids: [1], entities: { 1: { id: 1 } } },
  ]);
  store.dispatch(Update, { id: 2 });
  expect(snapshot.all).toEqual([
    { ids: [], entities: {} },
    { ids: [1], entities: { 1: { id: 1 } } },
    { ids: [1, 2], entities: { 1: { id: 1 }, 2: { id: 2 } } },
  ]);
});

test("back", () => {
  store.dispatch(Update, { id: 1 });
  store.dispatch(Update, { id: 2 });
  expect(snapshot.all).toEqual([
    { ids: [], entities: {} },
    { ids: [1], entities: { 1: { id: 1 } } },
    { ids: [1, 2], entities: { 1: { id: 1 }, 2: { id: 2 } } },
  ]);
  expect(snapshot.current).toEqual({
    ids: [1, 2],
    entities: { 1: { id: 1 }, 2: { id: 2 } },
  });

  snapshot.back();
  expect(snapshot.index).toBe(1);
  expect(snapshot.current).toEqual({
    ids: [1],
    entities: { 1: { id: 1 } },
  });
  expect(snapshot.all).toEqual([
    { ids: [], entities: {} },
    { ids: [1], entities: { 1: { id: 1 } } },
    { ids: [1, 2], entities: { 1: { id: 1 }, 2: { id: 2 } } },
  ]);

  snapshot.forward();
  expect(snapshot.current).toEqual({
    ids: [1, 2],
    entities: { 1: { id: 1 }, 2: { id: 2 } },
  });
  expect(snapshot.all).toEqual([
    { ids: [], entities: {} },
    { ids: [1], entities: { 1: { id: 1 } } },
    { ids: [1, 2], entities: { 1: { id: 1 }, 2: { id: 2 } } },
  ]);

  snapshot.back();
  store.dispatch(Update, { id: 3 });
  expect(snapshot.all).toEqual([
    { ids: [], entities: {} },
    { ids: [1], entities: { 1: { id: 1 } } },
    { ids: [1, 3], entities: { 1: { id: 1 }, 3: { id: 3 } } },
  ]);
});

test("backup whole state", () => {
  snapshot = snapshotStore(store);
  expect(snapshot.all).toEqual([{ todos: { ids: [], entities: {} } }]);
  store.dispatch(Update, { id: 1 });
  expect(snapshot.all).toEqual([
    { todos: { ids: [], entities: {} } },
    { todos: { ids: [1], entities: { 1: { id: 1 } } } },
  ]);
  snapshot.revert(0);
  expect(store.todos).toEqual({ ids: [], entities: {} });
});
