import tenx from "../index";

test("single prop", () => {
  const store = tenx({
    state: {
      value: 0
    },
    action: {
      update(store) {
        store.value++;
      }
    }
  });
  const callback = jest.fn();
  store.watch("value", (a) => callback(a.current));
  store.update();
  expect(callback).toBeCalledWith(1);
  store.update();
  expect(callback).toBeCalledWith(2);
});

test("multiple prop", () => {
  const store = tenx({
    state: {
      value1: 0,
      value2: 1
    },
    action: {
      update1(store) {
        store.value1++;
      },
      update2(store) {
        store.value2++;
      }
    }
  });
  const callback = jest.fn();
  store.watch(["value1", "value2"], (a) => callback(a.current));
  store.update1();
  expect(callback).toBeCalledWith({ value1: 1, value2: 1 });
  store.update2();
  expect(callback).toBeCalledWith({ value1: 1, value2: 2 });
});

test("using selector fn", () => {
  const store = tenx({
    state: {
      value1: 0,
      value2: 1
    },
    action: {
      update1(store) {
        store.value1++;
      },
      update2(store) {
        store.value2++;
      }
    }
  });
  const callback = jest.fn();
  store.watch(
    (store) => ({ value1: store.value1, value2: store.value2 }),
    (a) => callback(a.current)
  );
  store.update1();
  expect(callback).toBeCalledWith({ value1: 1, value2: 1 });
  store.update2();
  expect(callback).toBeCalledWith({ value1: 1, value2: 2 });
});
