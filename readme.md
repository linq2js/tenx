# TENX

A Flux implementation for javascript/React app

## Counter App using vanilla JS

```jsx
import tenx from "tenx";
const app = document.getElementById("app") || document.body;
const store = tenx({ count: 0 });
const Increase = ({ count }) => count.value++;
const render = () => {
  app.innerHTML = `<h1>${store.count}</h1><button id="increase">Increase</button>`;
  app.querySelector("#increase").onclick = () => store.dispatch(Increase);
};
store.when("update", render);
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
