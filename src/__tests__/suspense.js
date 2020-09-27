import { act, render, fireEvent } from "@testing-library/react";
import React, { Suspense } from "react";
import tenx from "../index";
import hookFactory from "../react";

const { delay } = tenx();

test("component store", async () => {
  const model = {
    state: {
      count: 1,
    },
    action: {
      async init(store) {
        await store.delay(10);
        store.count = 100;
      },
      increase(store) {
        store
          .get("count")
          .mutate(store.delay(10), (resolve, value) => value + 1);
      },
    },
  };
  const useCounterStore = hookFactory.component(model);
  const App = () => {
    const store = useCounterStore();
    const { count, increase, stateReady } = store;
    // for component store we must handle store loading logic manually
    // cannot wrap Suspense element outside component store
    // because Suspense element re-creates its children whenever it re-renders
    if (!stateReady()) {
      return <div data-testid="fallback">Loading...</div>;
    }

    return (
      <>
        <h1 data-testid="value">{count}</h1>
        <button data-testid="increase" onClick={increase} />
      </>
    );
  };

  function isLoading() {
    return expect(
      findByTestId("fallback").then((e) => e.innerHTML)
    ).resolves.toBe("Loading...");
  }

  const { getByTestId, findByTestId } = render(<App />);
  await isLoading();
  await act(() => delay(15));
  expect(getByTestId("value").innerHTML).toBe("100");
  fireEvent.click(getByTestId("increase"));
  await isLoading();
  await act(() => delay(15));
  expect(getByTestId("value").innerHTML).toBe("101");
});

test("shared store", async () => {
  const model = {
    state: {
      count: 1,
    },
    action: {
      async init(store) {
        await store.delay(10);
        store.count = 100;
      },
    },
  };
  const useCounterStore = hookFactory.shared(model);

  const App = () => {
    const { count } = useCounterStore((store) => ({ count: store.count }));
    return (
      <>
        <h1 data-testid="value">{count}</h1>
      </>
    );
  };

  const { getByTestId, findByTestId } = render(
    <Suspense fallback={<div data-testid="fallback">Loading...</div>}>
      <App />
    </Suspense>
  );

  await expect(findByTestId("fallback").then((e) => e.innerHTML)).resolves.toBe(
    "Loading..."
  );
  await act(() => delay(15));
  const $value = getByTestId("value");
  expect($value.innerHTML).toBe("100");
});
