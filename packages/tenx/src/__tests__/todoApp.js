import tenx from "../lib";
import { entitySet } from "../extras";

let store;
let id;
beforeEach(() => {
  id = 0;
  store = tenx(
    {
      filter: "all",
      todos: entitySet([]),
      editingTodoId: null,
      editingTodoTitle: null,
      computed: {
        completedStatuses: [
          "todos.map(completed)",
          (value) => ({ cache }) => cache(value),
        ],
        visibleTodoIds: [
          "todos.ids",
          "completedStatuses",
          "filter",
          filterTodos,
        ],
        completedTodoIds: [
          "todos.ids",
          "completedStatuses",
          [["completed"]],
          filterTodos,
        ],
        activeTodoIds: [
          "todos.ids",
          "completedStatuses",
          [["active"]],
          filterTodos,
        ],
        isAllTodosChecked: [
          "visibleTodoIds",
          "completedStatuses",
          (todoIds, completedStatuses) =>
            todoIds.every((id) => completedStatuses[id]),
        ],
        stats: {
          active: "activeTodoIds.length",
          completed: "completedTodoIds.length",
          all: "todos.ids.length",
        },
      },
    },
    {
      addTodo({ todos, filter }, title) {
        todos.update({
          id: id++,
          title,
          completed: false,
        });
        if (filter.value === "completed") {
          filter.value = "active";
        }
      },
      changeTodoTitle({ todos }, { id, title }) {
        todos.merge({ id, title });
      },
      toggleTodo({ todos }, id) {
        todos.updateIn({ id, completed: (value) => !value });
      },
      toggleAllTodos({ todos, isAllTodosChecked }) {
        const completed = !isAllTodosChecked.value;
        todos.update((todo) =>
          todo.completed === completed ? todo : { ...todo, completed }
        );
      },
      removeTodo({ todos }, id) {
        todos.remove(id);
      },
      clearCompleted({ todos }) {
        todos.remove((todo) => todo.completed);
      },
    }
  );
});

function filterTodos(ids, completedStatusMap, filter) {
  if (filter === "active") return ids.filter((id) => !completedStatusMap[id]);
  if (filter === "completed") return ids.filter((id) => completedStatusMap[id]);
  return ids;
}

test("completedStatuses", () => {
  store.addTodo("item 1");
  store.addTodo("item 2");
  const map1 = store.completedStatuses;
  expect(map1).toEqual({ 0: false, 1: false });
  store.changeTodoTitle({ id: 1, title: "item 1 changed" });
  const map2 = store.completedStatuses;
  expect(map2).toBe(map1);
});

test("dynamic computed prop", () => {
  store.addTodo("item 1");
  store.addTodo("item 2");
  expect(store.activeTodoIds).toEqual([0, 1]);
  expect(store.completedTodoIds).toEqual([]);
});

test("stats", () => {
  expect(store.stats).toEqual({ active: 0, completed: 0, all: 0 });
  store.addTodo("item 1");
  store.addTodo("item 2");
  expect(store.stats).toEqual({ active: 2, completed: 0, all: 2 });
});

test("toggleTodo", () => {
  store.addTodo("item 1");
  store.toggleTodo(0);
  expect(store.todos.entities[0].completed).toBeTruthy();
  store.toggleTodo(0);
  expect(store.todos.entities[0].completed).toBeFalsy();
});

test("toggleAllTodos", () => {
  store.addTodo("item 1");
  store.addTodo("item 2");
  store.toggleAllTodos();
  expect(store.completedStatuses).toEqual({ 0: true, 1: true });
  store.toggleAllTodos();
  expect(store.completedStatuses).toEqual({ 0: false, 1: false });
});

test("removeTodo", () => {
  store.addTodo("item 1");
  store.addTodo("item 2");
  store.addTodo("item 3");
  store.removeTodo(1);
  expect(store.todos.ids).toEqual([0, 2]);
});

test("clearCompleted", () => {
  store.addTodo("item 1");
  store.addTodo("item 2");
  store.addTodo("item 3");
  store.toggleTodo(0);
  store.toggleTodo(2);
  store.clearCompleted();
  expect(store.todos.ids).toEqual([1]);
});
