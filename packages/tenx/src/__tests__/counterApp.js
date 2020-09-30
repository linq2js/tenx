import { render, fireEvent } from "@testing-library/react";
import React from "react";
import tenx from "../lib";
import { useStore } from "../react";

test("simple counter", () => {
  const store = tenx({ count: 0 });
  const Increase = ({ count }) => count.value++;
  const App = () => {
    const { count, increase } = useStore(
      store,
      (state, { callback, dispatch }) => ({
        count: state.count,
        increase: callback(() => dispatch(Increase)),
      })
    );
    return (
      <h1 data-testid="value" onClick={increase}>
        {count}
      </h1>
    );
  };
  const { getByTestId } = render(<App />);
  expect(getByTestId("value").innerHTML).toBe("0");
  fireEvent.click(getByTestId("value"));
  fireEvent.click(getByTestId("value"));
  expect(getByTestId("value").innerHTML).toBe("2");
});
