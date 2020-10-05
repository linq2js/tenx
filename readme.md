# tenx

A Flux implementation for javascript/React app

## Installation

```
npm i tenx --save
```

## Introduction

In this article, I am going to help you to learn the fundamentals of react and tenx.
We will do this by implementing a todolist app using react and tenx.

### Core concepts

Basically 2 core concepts in tenx:

1. Store
1. Actions

#### What is the store ?

The store is an object which holds all the app data.
This holds the state of our app and this can be used everywhere in our project.

Unlikely redux, you can define many stores in your app, but we use only single store for todolist app

#### Actions

Actions are pure functions. You can only mutate app state inside the actions.
So action is where you put all app logics.

An action takes **two** parameters. The first parameter is store context.
It contains many named state mutators and provides some util functions for advanced usages.
The second parameter is an action payload.

## Creating a simple todo app

### Defining app state tree

Firstly, we need to define an app state tree. Todos state is array of todo item, that's looks like:

```jsx
const state = {
  todos: [
    { id: 1, title: "Todo 1", completed: false },
    { id: 2, title: "Todo 2", completed: false },
  ],
};
```

### Creating tenx store

We use tenx() function to create a store, the first parameter is initial state of store

```jsx
import tenx from "tenx";
const initial = {
  // A store has one state, it names todos
  todos: [
    { id: 1, title: "Todo 1", completed: false },
    { id: 2, title: "Todo 2", completed: false },
  ],
};
const store = tenx(initial);
```

### Defining actions

We pass action map as second parameter of tenx() function

```jsx
const store = tenx(initial, {
  action1(context, payload) {},
  action2(context, payload) {},
});
```

Let's create a first addTodo action

```jsx
const store = tenx(initial, {
  addTodo(context, payload) {
    // destructing context to retrieve todos state object
    const { todos } = context;
    // a payload is new todo title
    const title = payload;
    // retrieve current value of todos state object using todos.value
    // create a copy of todos array and append new item at end
    // assign back to todos state object using todos.value = newValue
    // DO NOT mutate state value directly: todos.value.push(newItem)
    todos.value = todos.value.concat({
      id: Date.now(),
      title,
      completed: false,
    });
  },
});
```

If you see the above code, we have created an action called ‘addTodo’.
You can dispatch addTodo action by using store.actionName(payload):

```jsx
// context object is passed automatically by store, we pass action payload only
store.addTodo("Todo 2");
store.addTodo("Todo 3");
```

### Consuming store state

```jsx
import React, { useRef } from "react";
import { useStore } from "tenx/react";

function App() {
  const inputRef = useRef();
  const { todos } = useStore(store, function (state) {
    return {
      todos: state.todos,
    };
  });

  function handleSubmit(e) {
    e.preventDefault();
    // dispatch addTodo action
    store.addTodo(inputRef.current.value);
    inputRef.current.value = "";
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          ref={inputRef}
          placeholder="What need to be done ?"
        />
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  );
}
```

As you see above code, we import useStore() from "tenx/react".
"tenx/react" is other entry point of tenx package.
This entry includes many utils/hooks for React, we will discover them later on.

useStore() is a React hook, it takes 2 parameters.
The first one is tenx store object, the second one is state mapping function.
First parameter of mapping function is state object, it presents all state values of store.
In this case, we select todos value (its value is array type, not state mutator) from state object.

We successfully created addTodo action and consumed todos state.
Now we need to create other actions, toggleTodo and removeTodo.

```jsx
const store = tenx(initial, {
  // addTodo() {},
  toggleTodo({ todos }, id) {
    todos.value = todos.value.map((todo) =>
      todo.id === id
        ? {
            // copy all prev prop values
            ...todo,
            // update completed prop
            completed: !todo.completed,
          }
        : // nothing to change
          todo
    );
  },
  removeTodo({ todos }, id) {
    todos.value = todos.value.filter((todo) => todo.id !== id);
  },
});
```

We need to update App component as well

```jsx
return (
  <>
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <button onClick={() => store.toggleTodo(todo.id)}>toggle</button>
          <button onClick={() => store.removeTodo(todo.id)}>remove</button>
          <span
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
            }}
          >
            {todo.title}
          </span>
        </li>
      ))}
    </ul>
  </>
);
```

You can find full source [here](https://github.com/linq2js/tenx/tree/master/packages/examples/todo-app-basic)

## Introducing computed state

In a previous section we have created some actions for todo app: addTodo, removeTodo, toggleTodo.
Let's create component displays some useful info of todo list.

```jsx
function TodoFilter() {
  const { allTodoCount, activeTodoCount, completedTodoCount } = useStore(
    store,
    function (state) {
      return {
        allTodoCount: state.todos.length,
        activeTodoCount: state.todos.filter((todo) => !todo.completed).length,
        completedTodoCount: state.todos.filter((todo) => todo.completed).length,
      };
    }
  );
  return (
    <>
      <div>All ({allTodoCount})</div>
      <div>Active ({activeTodoCount})</div>
      <div>Completed ({completedTodoCount})</div>
    </>
  );
}
```

The TodoFilter component above needs 3 states: allTodoCount, activeTodoCount and completedTodoCount.
Those states will be re-computed whenever the component render, evenly no app state updated.
By using derived / computed state, you can define some dynamic state computation easily,
and computed states only re-compute when your app state changed. Let update store creating code.

```jsx
const store = tenx(
  {
    // static states
    // ...
    computed: {
      allTodoCount(state) {
        return state.todos.length;
      },
      activeTodoCount(state) {
        return state.todos.filter((todo) => !todo.completed).length;
      },
      completedTodoCount(state) {
        return state.todos.filter((todo) => todo.completed).length;
      },
    },
  },
  {
    // actions
  }
);
```

We need to refactor TodoFilter component to consume computed states

```jsx
function TodoFilter() {
  const { allTodoCount, activeTodoCount, completedTodoCount } = useStore(
    store,
    function (state) {
      return {
        // consuming computed states is the same of normal states, easy ?
        allTodoCount: state.allTodoCount,
        activeTodoCount: state.activeTodoCount,
        completedTodoCount: state.completedTodoCount,
      };
    }
  );
  return (
    <>
      <div>All ({allTodoCount})</div>
      <div>Active ({activeTodoCount})</div>
      <div>Completed ({completedTodoCount})</div>
    </>
  );
}
```

Let's go into deep dives on computed states. Computed state can be:

#### computedFunction(state)

A function that returns computed value

```jsx
tenx({
  computed: {
    activeTodoCount(state) {
      return state.todos.filter((todo) => !todo.completed);
    },
  },
});
```

#### Tuple \[...dependencyList, combiner]

Each dependency item can be:

**string** (name of static state or other computed states)

**function** (a function returns slice of state)

Combiner is a function that retrieves all values of dependency list and returns combined value.

```jsx
tenx({
  todos: [],
  filter: "all",
  computed: {
    visibleTodos: [
      "todos",
      "fitler",
      function (todos, filter) {
        if (filter === "active") return todos.filter((todo) => !todo.completed);
        if (filter === "completed")
          return todos.filter((todo) => todo.completed);
        return todos;
      },
    ],
  },
});
```

## How to persist app state

Sometimes you want to store your app state to persistence storage (sessionStorage, localStorage, AsyncStorage etc.).
We define init action to add some logics for handling app state changing.

```jsx
const store = tenx(initial, {
  init(context) {
    const persistedTodos = JSON.parse(localStorage.getItem("appState"));
    if (persistedTodos) {
      context.todos.value = persistedTodos;
    }

    // by using watch api, we can listen when specified state prop changed
    context.watch("todos", function (e) {
      // current value of watched state
      console.log(e.current);
      // previous value of watched state
      console.log(e.previous);
      // save todos to local storage
      localStorage.setItem("appState", JSON.stringify(e.current));
    });
  },
});
```

An init action will be dispatched when store runs initializing phase.
If you define init action is async function, your components cannot consume store state until init action finished.

```jsx
const store = tenx(initial, {
  async init(context) {
    // todoServer performs loading todos from server
    const persistedTodos = await todoService.load();
    if (persistedTodos) {
      context.todos.value = persistedTodos;
    }

    // by using watch api, we can listen when specified state prop changed
    context.watch("todos", function (e) {
      // current value of watched state
      console.log(e.current);
      // previous value of watched state
      console.log(e.previous);
      // save todos to local storage
      todoService.save(e.current);
    });
  },
});
```

In component render function, an error will be thrown if you try to consume in progress store.
To handle store initializing progress, you must wrap your App component inside React.Suspense element.

```jsx
import React, { Suspense } from "react";
import { render } from "react-dom";
import App from "./compoments/App";

render(
  <Suspense fallback="Application loading...">
    <App />
  </Suspense>
);
```

You can find fully example about lazy state persistence [here](https://github.com/linq2js/tenx/tree/master/packages/examples/state-persistence)

## Introducing store snapshot (TBD)

## Introducing Saga (TBD)

## React develop tools (TBD)

### Reactotron (TBD)

## Writing unit tests (TBD)

## Features (TBD)

## API Reference (TBD)

## Examples

[Snake Game](https://github.com/linq2js/tenx/tree/master/packages/examples/snake-game)
[Movie Search](https://github.com/linq2js/tenx/tree/master/packages/examples/move-search)
[Todo App](https://codesandbox.io/s/tenx-todos-6f38j?file=/src/store/index.js)
