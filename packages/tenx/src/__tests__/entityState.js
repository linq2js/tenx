import { entity } from "../extras";
import tenx from "../lib";

test("update nested prop", () => {
  const store = tenx({
    todos: entity({
      1: {
        id: 1,
        title: "item 1",
      },
      2: {
        id: 2,
        title: "item 2",
      },
    }),
  });

  const todosInitial = store.todos;
  store.dispatch(({ todos }) => {
    todos.set("1.title", "item new");
  });
  expect(store.todos).toEqual({
    1: {
      id: 1,
      title: "item new",
    },
    2: {
      id: 2,
      title: "item 2",
    },
  });
  expect(todosInitial).not.toBe(store.todos);

  store.dispatch(({ todos }) => {
    todos.set({
      "1.title": "",
      "2.title": "",
    });
  });
  const r1 = store.todos;
  expect(store.todos).toEqual({
    1: {
      id: 1,
      title: "",
    },
    2: {
      id: 2,
      title: "",
    },
  });
  store.dispatch(({ todos }) => {
    todos.set({
      "1.title": "",
      "2.title": "",
    });
  });
  expect(r1).toBe(store.todos);
});
