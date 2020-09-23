import { render, fireEvent } from "@testing-library/react";
import React from "react";
import tenx from "../react";
import store from "../store";

const counterStore = store({ initial: { count: 0 } });

function App() {
  const count = tenx(() => counterStore.count);
  return (
    <>
      <div data-testid="value">{count}</div>
      <button data-testid="increase" onClick={() => tenx("increase")} />
      <button data-testid="decrease" onClick={() => tenx("decrease")} />
    </>
  );
}

function handleIncrease() {
  tenx("increase", () => counterStore.count++);
}

function handleDecrease() {
  tenx("decrease", () => counterStore.count--);
}

beforeEach(() => {
  counterStore.reset();
  tenx().cleanup();
});

test("increase", () => {
  const { getByTestId } = render(<App />);

  handleIncrease();
  handleDecrease();

  fireEvent.click(getByTestId("increase"));
  fireEvent.click(getByTestId("increase"));
  expect(getByTestId("value").innerHTML).toBe("2");
  fireEvent.click(getByTestId("decrease"));
  expect(getByTestId("value").innerHTML).toBe("1");
});
