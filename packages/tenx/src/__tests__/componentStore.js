import { render, fireEvent } from "@testing-library/react";
import React from "react";
import { componentStore } from "../react";

const useCounterStore = componentStore({ count: 0 });

test("counter", () => {
  const App = () => {
    const { count, callback } = useCounterStore();
    const increase = callback(() => count.value++);
    return (
      <h1 data-testid="value" onClick={increase}>
        {count.value}
      </h1>
    );
  };
  const { getByTestId } = render(<App />);
  const $value = getByTestId("value");
  expect($value.innerHTML).toBe("0");
  fireEvent.click($value);
  fireEvent.click($value);
  expect($value.innerHTML).toBe("2");
});
