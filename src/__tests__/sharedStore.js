import { render, fireEvent } from "@testing-library/react";
import React, { useRef } from "react";
import hookFactory from "../react";

test("counter", () => {
  const model = {
    state: {
      count: 1,
    },
    action: {
      increase(store, by = 1) {
        store.count += by;
      },
    },
  };
  const useCounterStore = hookFactory.shared(model);

  const App = () => {
    const data = useRef({}).current;
    const { count, increase, increase2, increase4 } = useCounterStore(
      (store) => ({
        count: store.count,
        increase: store.increase,
        increase2: store.cache(() => store.increase(2)),
        increase4: store.cache(() => store.increase(4)),
      })
    );
    if (data.increase2 && data.increase2 !== increase2)
      throw new Error("increase2 is not cached");
    data.increase2 = increase2;
    if (data.increase4 && data.increase4 !== increase4)
      throw new Error("increase4 is not cached");
    data.increase4 = increase4;

    return (
      <>
        <h1 data-testid="value">{count}</h1>
        <button data-testid="increase" onClick={() => increase()} />
        <button data-testid="increase2" onClick={() => increase2()} />
        <button data-testid="increase4" onClick={() => increase4()} />
      </>
    );
  };

  const { getByTestId } = render(<App />);
  const $value = getByTestId("value");
  const $increase = getByTestId("increase");
  const $increase2 = getByTestId("increase2");
  const $increase4 = getByTestId("increase4");

  expect($value.innerHTML).toBe("1");

  fireEvent.click($increase);
  expect($value.innerHTML).toBe("2");

  fireEvent.click($increase2);
  expect($value.innerHTML).toBe("4");

  fireEvent.click($increase4);
  expect($value.innerHTML).toBe("8");
});
