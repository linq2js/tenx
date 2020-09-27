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
      // we can mutate count state easily
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
