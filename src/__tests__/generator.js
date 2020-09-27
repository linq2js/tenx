import tenx from "../index";

test("mutate state", async () => {
  const store = tenx({
    state: {
      count: 0,
    },
    action: {
      *increaseAsync(store) {
        yield store.delay(10);
        store.count++;
      },
    },
  });

  store.increaseAsync();
  expect(store.count).toBe(0);
  await store.delay(15);
  expect(store.count).toBe(1);

  const task = store.increaseAsync();
  task.cancel();
  await store.delay(15);
  expect(store.count).toBe(1);

  store.increaseAsync();
  await store.delay(15);
  expect(store.count).toBe(2);
});

test("call", async () => {
  const callback = jest.fn();
  const store = tenx({
    action: {
      getValue() {
        return 1;
      },
      async getAsyncValue(store) {
        await store.delay(10);
        return 2;
      },
      *getGeneratorValue(store) {
        yield store.delay(10);
        return 3;
      },
      *saga(store) {
        const syncValue = yield store.getValue();
        const asyncValue = yield store.getAsyncValue();
        const generatorValue = yield store.getGeneratorValue();
        const result = syncValue + asyncValue + generatorValue;
        callback(result);
        return result;
      },
    },
  });

  const r = await store.saga();
  expect(r).toBe(6);
  expect(callback).toBeCalledWith(6);
});

test("watcher (while)", () => {
  const store = tenx({
    state: {
      count: 0,
    },
    action: {
      *increaseWatcher(store) {
        while (true) {
          const action = yield store.when("increase");
          expect(action).toEqual({ type: "increase", payload: 1 });
          store.count++;
        }
      },
    },
  });

  store.increaseWatcher();
  expect(store.count).toBe(0);
  store.dispatch("increase", 1);
  expect(store.count).toBe(1);

  store.dispatch("increase", 1);
  expect(store.count).toBe(2);
});

test("debounce", async () => {
  const store = tenx({
    state: {
      count: 0,
    },
    action: {
      *increase(store) {
        yield store.debounce(10);
        store.count++;
      },
    },
  });

  store.increase();
  store.increase();
  store.increase();

  await store.delay(15);
  expect(store.count).toBe(1);
});

test("race", async () => {
  const store = tenx({
    state: {
      count: 0,
    },
    action: {
      *increaseWatcher(store) {
        while (yield store.when("start")) {
          const { cancel } = yield {
            cancel: store.when("cancel"),
            success: store.increase(),
          };
          if (cancel) continue;
          store.count++;
        }
      },
      *increase(store) {
        yield store.debounce(10);
        store.count++;
      },
    },
  });

  store.increaseWatcher();
  await store.delay(5);
  store.dispatch("start");
  expect(store.count).toBe(0);
  store.dispatch("cancel");
  await store.delay(15);
  expect(store.count).toBe(0);
});

test("all", () => {
  const store = tenx({
    state: {
      count: 0,
    },
    action: {
      *watcher(store) {
        yield [store.when("action1"), store.when("action2")];
        store.count++;
      },
    },
  });
  store.watcher();
  store.dispatch("action1");
  expect(store.count).toBe(0);
  store.dispatch("action2");
  expect(store.count).toBe(1);
});

test("async and sync", async () => {
  const store = tenx({
    action: {
      *sync() {
        return 1;
      },
      *async(store) {
        yield store.delay(10);
        return 2;
      },
    },
  });

  const r1 = store.sync();
  const r2 = store.async();
  expect(r1.result).toBe(1);
  expect(r1.async).toBeFalsy();

  expect(r2.result).toBeUndefined();
  expect(r2.async).toBeTruthy();
  await store.delay(15);
  expect(r2.result).toBe(2);
});

test("fork", () => {
  const store = tenx({
    state: {
      count1: 0,
      count2: 0,
    },
    action: {
      *mainSaga(store) {
        yield store.saga1.fork();
        yield store.saga2.fork();
      },
      *saga1(store) {
        while (yield store.when("increase1")) {
          store.count1++;
        }
      },
      *saga2(store) {
        while (yield store.when("increase2")) {
          store.count2++;
        }
      },
    },
  });

  const task = store.mainSaga();

  store.dispatch("increase1");
  expect(store.count1).toBe(1);

  store.dispatch("increase2");
  expect(store.count2).toBe(1);

  task.cancel();

  store.dispatch("increase1");
  expect(store.count1).toBe(1);

  store.dispatch("increase2");
  expect(store.count2).toBe(1);
});
