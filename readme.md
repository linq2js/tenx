# TENX

A Flux implementation for javascript/React app

## Installation

```
npm i tenx --save
```

## Introduction

In this introduction you will get an overview of TENX and how you can think about application development.
We will be using REACT to write the UI, but you can use TENX with VUE and ANGULAR if either of those is your preference.

Before we move on, have a quick look at this sandbox.
It is a simple counter application, and it gives you some foundation before talking more about TENX and building applications.

```jsx
import React from "react";
import ReactDOM from "react-dom";
import tenx from "tenx";
import { useStore } from "tenx/react";

const store = tenx({
  count: 0,
});

const increaseCountAction = ({ count }) => count.value++;
const decreaseCountAction = ({ count }) => count.value++;

const useApp = function () {
  return useStore(store, (state, { dispatch }) => {
    return {
      count: state.count,
      increaseCount() {
        dispatch(increaseCountAction);
      },
      decreaseCount() {
        dispatch(decreaseCountAction);
      },
    };
  });
};

function App() {
  const { count, increaseCount, decreaseCount } = useApp();

  return (
    <div className="App">
      <h1>{state.count}</h1>
      <button onClick={increaseCount}>decrease</button>
      <button onClick={decreaseCount}>increase</button>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(
  <Provider value={app}>
    <App />
  </Provider>,
  rootElement
);
```

### Application state VS Component state

First of all we have to talk about application and component state. In the counter example above we chose to define our count state as application state, outside of the component.
We could have defined the count inside the component instead, and the application would work exactly the same. So why did we choose application state?

If the count example above was the entire application it would not make any sense to introduce application state and TENX.
But if you were to increase the scope of this simple application you would be surprised how quickly you get into the following scenarios:

You want to introduce other component needs to know about the current state of the count. This new component cannot be a parent of the component owning the count state.
It cannot be a sibling either. It has to be a child. If it is not an immediate child the count state has to be passed down the component tree until it reaches your new component.

You want to remember the count, even though it is not shown in the UI. Your count is behind one of multiple tabs in the UI. When the user changes the tabs you do not want the count to reset.
The only way to ensure this is to move the count state up to a parent component that is no longer a child of the tab and then pass the count state back down again.

You want to change the count from a side effect.
You have a websocket connection which changes the count when a message is received.
If you want to avoid this websocket connection to open and close as the component mounts and unmounts you will have to move the websocket connection up the component tree.

You want to change the count as part of multiple changes.
When you click the increase count button you need to change both the count state and other state related to a different part of the UI. To be able to change both states at the same time, they have to live inside the same component, which has to be a parent of both components using the state.

Introducing these scenarios we said: You want. In reality we rarely know exactly what we want. We do not know how our state and components will evolve.
And this is the most important point. By using application state instead of component state you get flexibility to manage whatever comes down the road without having to refactor wrong assumptions.

### Defining store

As you can see in the count example we added a state object when we created the instance.

```jsx
const store = tenx({
  count: 0,
});
```

This store object will hold all the application state, we call it a single state tree. That does not mean you define all the state in one file and we will talk more about that later.
For now let us talk about what you put into this state tree.

A single state tree typically favours serializable state. That means state that can be JSON.parse and JSON.stringify back and forth. It can be safely passed between the client and the server, localStorage or to web workers. You will use strings, numbers, booleans, arrays, objects and null. TENX also has the ability to allow you define state values as class instances, even serializing back and forth..

### Defining actions

When you need to change your state you define actions. TENX only allows changing the state of the application inside the actions. The actions are plain functions. The only thing that makes them special is that they all receive a preset first argument, called the context:

```jsx
function increaseCount({ count }) {
  count.value++;
}
function decreaseCount({ count }) {
  count.value--;
}
```

Here we can see that we DESTRUCTURE the context to grab the count state object.
A state object has "value" getter/setter that uses to read current state value and change its value.
If you want to dispatch other action, you should destructure "dispatch" method:

```jsx
function increaseCount({ count }) {
  count.value++;
}

function doubleCount({ dispatch }) {
  dispatch(increaseCount);
  dispatch(increaseCount);
}
```

TENX supports async action as well

```jsx
import { delay } from "tenx/extras";

function increaseCount({ count }) {
  count.value++;
}

async function increaseCountAsync({ dispatch }) {
  await delay(1000);
  dispatch(increaseCount);
}
```

### Increasing complexity


## Features

1. Simple API.
1. No Provider needed.
1. No Action Creators needed.
1. Easy to writing Unit Tests.
1. Computed/Derived States supported.
1. Lazy state mutating / displaying.
1. Lazy store initializing.
1. React.Suspense supported.
1. Data fetching / side effects
1. Local store supported
1. React Native supported
1. Hot Reloading supported
1. Reactotron supported
1. Future action listening supported
1. Cancellable action dispatching supported

## Examples

[Real world examples can be found here](https://github.com/linq2js/tenx/tree/master/packages/examples)
