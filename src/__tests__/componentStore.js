import { render, fireEvent } from "@testing-library/react";
import React from "react";
import hookFactory from "../react";

test("counter", () => {
  const model = {
    state: {
      count: 1,
    },
    action: {
      increase(store) {
        store.count++;
      },
    },
  };
  const useCounterStore = hookFactory.component(model);
  const App = () => {
    const store = useCounterStore();
    return (
      <>
        <h1 data-testid="value">{store.count}</h1>
        <button data-testid="increase" onClick={store.increase} />
      </>
    );
  };

  const { getByTestId } = render(<App />);
  const $value = getByTestId("value");
  const $increase = getByTestId("increase");
  expect($value.innerHTML).toBe("1");
  fireEvent.click($increase);
  expect($value.innerHTML).toBe("2");
});
