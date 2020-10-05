import React, { useRef } from "react";
import tenx from "tenx";
import { useStore } from "tenx/react";
import "./App.css";

const store = tenx(
  {
    todos: [],
  },
  {
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
  }
);

function App() {
  const inputRef = useRef();
  const { todos } = useStore(store, function (state) {
    return {
      todos: state.todos,
    };
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!inputRef.current.value) return;
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
}

export default App;
