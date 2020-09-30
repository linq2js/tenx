import delay from "../extras/delay";
import tenx from "../lib";

test("mutate state", async () => {
  const store = tenx({
    count: 0,
  });

  function* increaseAsync({ delay, count }) {
    yield delay(10);
    count.value++;
  }

  store.dispatch(increaseAsync);
  expect(store.count).toBe(0);
  await delay(15);
  expect(store.count).toBe(1);

  const task = store.dispatch(increaseAsync);
  task.cancel();
  await delay(15);
  expect(store.count).toBe(1);

  store.dispatch(increaseAsync);
  await delay(15);
  expect(store.count).toBe(2);
});

test("call", async () => {
  const callback = jest.fn();

  const store = tenx({});

  function getValue() {
    return 1;
  }

  async function getAsyncValue({ delay }) {
    await delay(10);
    return 2;
  }

  function* getGeneratorValue({ delay }) {
    yield delay(10);
    return 3;
  }

  function* saga({ dispatch }) {
    const syncValue = yield dispatch(getValue);
    const asyncValue = yield dispatch(getAsyncValue);
    const generatorValue = yield dispatch(getGeneratorValue);
    const result = syncValue + asyncValue + generatorValue;
    callback(result);
    return result;
  }
  const r = await store.dispatch(saga);
  expect(r).toBe(6);
  expect(callback).toBeCalledWith(6);
});

test("watcher (while)", () => {
  const increase = () => {};
  const store = tenx({
    count: 0,
  });
  function* increaseWatcher({ when, count }) {
    while (true) {
      const action = yield when(increase);
      expect(action).toEqual({ type: increase, payload: 1 });
      count.value++;
    }
  }
  store.dispatch(increaseWatcher);
  expect(store.count).toBe(0);
  store.dispatch(increase, 1);
  expect(store.count).toBe(1);

  store.dispatch(increase, 1);
  expect(store.count).toBe(2);
});

test("debounce", async () => {
  const store = tenx({
    count: 0,
  });
  function* increase({ debounce, count }) {
    yield debounce(10);
    count.value++;
  }
  store.dispatch(increase);
  store.dispatch(increase);
  store.dispatch(increase);

  await delay(15);
  expect(store.count).toBe(1);
});

test("race", async () => {
  const store = tenx({
    count: 0,
  });
  const start = () => {};
  const cancel = () => {};
  function* increaseWatcher({ count, when, dispatch }) {
    while (yield when(start)) {
      const { cancelled } = yield {
        cancelled: when(cancel),
        succeeded: dispatch(increase),
      };
      if (cancelled) continue;
      count.value++;
    }
  }
  function* increase({ count, debounce }) {
    yield debounce(10);
    count.value++;
  }

  store.dispatch(increaseWatcher);
  await delay(5);
  store.dispatch(start);
  expect(store.count).toBe(0);
  store.dispatch(cancel);
  await delay(15);
  expect(store.count).toBe(0);
});

test("all", () => {
  const store = tenx({
    count: 0,
  });
  const action1 = () => {};
  const action2 = () => {};
  function* watcher({ count, when }) {
    yield [when(action1), when(action2)];
    count.value++;
  }

  store.dispatch(watcher);
  store.dispatch(action1);
  expect(store.count).toBe(0);
  store.dispatch(action2);
  expect(store.count).toBe(1);
});

test("async and sync", async () => {
  const store = tenx({});
  function* sync() {
    return 1;
  }
  function* async({ delay }) {
    yield delay(10);
    return 2;
  }
  const r1 = store.dispatch(sync);
  const r2 = store.dispatch(async);
  expect(r1.result).toBe(1);
  expect(r1.async).toBeFalsy();

  expect(r2.result).toBeUndefined();
  expect(r2.async).toBeTruthy();
  await delay(15);
  expect(r2.result).toBe(2);
});

test("fork", () => {
  const store = tenx({
    count1: 0,
    count2: 0,
  });
  const increase1 = () => {};
  const increase2 = () => {};
  function* mainSaga({ fork }) {
    yield fork(saga1);
    yield fork(saga2);
  }
  function* saga1({ count1, when }) {
    while (yield when(increase1)) {
      count1.value++;
    }
  }
  function* saga2({ count2, when }) {
    while (yield when(increase2)) {
      count2.value++;
    }
  }

  const task = store.dispatch(mainSaga);

  store.dispatch(increase1);
  expect(store.count1).toBe(1);

  store.dispatch(increase2);
  expect(store.count2).toBe(1);

  task.cancel();

  store.dispatch(increase1);
  expect(store.count1).toBe(1);

  store.dispatch(increase2);
  expect(store.count2).toBe(1);
});

test("cancel async mutation", async () => {
  const store = tenx({ count: 0 });
  const task = store.dispatch(function* ({ count, mutate }) {
    yield mutate(
      { count },
      new Promise((resolve) => setTimeout(resolve, 10)).then(() => ({
        count: 100,
      }))
    );
  });
  expect(store.count).toBe(0);
  task.cancel();
  await delay(15);
  expect(store.count).toBe(0);
});
