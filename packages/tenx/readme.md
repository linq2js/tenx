# TENX

A Flux implementation for javascript/React app

## Counter App using vanilla JS

```jsx
import tenx from "tenx";
const app = document.getElementById("app") || document.body;
const store = tenx({ count: 0 });
//                     👆 set initial value of count state
// action is pure function
const Increase = ({ count }) => count.value++;
//                    👆 destructing mutable object of count state from action context
const render = () => {
  app.innerHTML = `<h1>${store.count}</h1><button id="increase">Increase</button>`;
  //                           👆 select count state from store
  app.querySelector("#increase").onclick = () => store.dispatch(Increase);
};
store.when("update", render);
//            👆 listen store update event
render();
```

## Counter App using React

```jsx
import tenx from "tenx";
import { useStore } from "tenx/react";
const store = tenx({ count: 0 });
const Increase = ({ count }) => count.value++;
const App = () => {
  const count = useStore(store, (state) => state.count);
  return (
    <>
      <h1>{count}</h1>
      <button onClick={store.dispatch(Increase)}>Increase</button>
    </>
  );
};
```

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

## Examples:

[Real world examples can be found here](https://github.com/linq2js/tenx/tree/master/packages/examples)
