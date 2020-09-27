# TENX

A tiny flux implementation for javascript/React app

## A simple counter app

```jsx
import React from "react";
import hookFactory from "tenx/react";

// store is just plain object
// it decribes store components (states, actions...)
const storeModel = {
  state: {
    // define count state and use 0 as initial value
    count: 0,
  },
  action: {
    // store action is pure action, the first action argument is store object
    increase(store) {
      // we can use store object to mutate count state easily
      store.count++;
    },
  },
};
// using hookFactory to create shared store hook
const useCounterStore = hookFactory.shared(storeModel);
const App = () => {
  // select specified components from counter store
  const { count, increase } = useCounterStore((store) => ({
    count: store.count,
    increase: store.increase,
  }));
  return (
    <>
      <h1>{count}</h1>
      <button onClick={() => increase()}>Increase</button>
    </>
  );
};
```

## Handle async action

With TENX, you can handle async action without any effort, no thunk, no middleware needed

```jsx
const storeModel = {
  state: {
    count: 0,
  },
  action: {
    increase(store) {
      store.count++;
    },
    async increaseAsync(store) {
      // store provides delay util
      await store.delay(1000);
      // dispatch increase action after 1000ms
      store.increase();
    },
  },
};
```

## Derived/computed state

Looking through the example you have probably noticed these:

```jsx
function filterTodos(todos, filter) {
  if (filter === "all") return todos;
  if (filter === "active") return todos.filter((todo) => !todo.completed);
  return todos.filter((todo) => todo.completed);
}

const storeModel = {
  state: {
    todos: [],
    filter: "all",
  },
  computed: {
    activeTodoCount(state) {
      return filterTodos(state.todos, "active");
    },
    completedTodoCount(state) {
      return filterTodos(state.todos, "completed");
    },
    hasCompletedTodos(state) {
      return state.todos.some((todo) => todo.completed);
    },
    visibleTodos(state) {
      return filterTodos(state.todos, state.filter);
    },
    // computed state can depend on other computed states or static states
    stats: [
      // other computed states
      "activeTodoCount",
      "completedTodoCount",
      // static state
      "todos",
      // combiner,
      function (activeTodos, completedTodos, allTodos) {
        return {
          active: activeTodos.length,
          completed: completedTodos.length,
          total: allTodos.length,
        };
      },
    ],
  },
};
```

Our state tree is concerned with state values that you will change using actions.
But you can also automatically produce state values based on existing state.
It uses the todos and filter state to figure out what todos to actually display.
