# TENX

A tiny flux implementation for javascript/React app

## 10 lines of code Counter App

```jsx
import tenx from "tenx/react";

let countState = 0;
tenx("increase", () => countState++);
const App = () => (
  <>
    <h1>{tenx(() => countState)}</h1>
    <button onClick={() => tenx("increase")}>+</button>
  </>
);
```

We can create a Counter App easily with 10 lines of code
We must add react binding for tenx

```jsx
import tenx from "tenx/react";
```

We then declare a variable to keep count value

```jsx
let countState = 0;
```

Using overload **tenx(actionName, listener)** to add increase action listener to tenx, the listener will be called when increase action dispatched.
The action listener does increment the value of the count variable.

```jsx
tenx("increase", () => countState++);
```

To dispatch an increase action, just call overload **tenx(actionName, payload)**

```jsx
<button onClick={() => tenx("increase")}>+</button>
```

## Examples

1. [Counter App](https://codesandbox.io/s/strange-morning-2x2r4?file=/src/App.js)
