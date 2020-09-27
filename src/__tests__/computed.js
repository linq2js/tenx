import globalContext  from "../globalContext";
import tenx from "../index";

test("prop selector", () => {
  const store = tenx({
    state: {
      count: 0,
    },
    computed: {
      countValue: "count",
    },
  });

  expect(store.countValue).toBe(0);
  store.count++;
  expect(store.countValue).toBe(1);
});

test("function selector", () => {
  const store = tenx({
    state: {
      count: 0,
    },
    computed: {
      countValue: (state) => state.count,
    },
  });

  expect(store.countValue).toBe(0);
  store.count++;
  expect(store.countValue).toBe(1);
});

test("selector dependency", () => {
  const store = tenx({
    state: {
      count: 1,
    },
    computed: {
      doubleCount: ["count", (count) => count * 2],
    },
  });

  expect(store.doubleCount).toBe(2);
  store.count++;
  expect(store.doubleCount).toBe(4);
});

test("private selector", () => {
  const store = tenx({
    state: {
      count: 1,
    },
    computed: {
      _count: (state) => state.count,
      doubleCount: ["_count", (count) => count * 2],
    },
  });

  expect(store._count).toBeUndefined();
  expect(store.doubleCount).toBe(2);
  store.count++;
  expect(store.doubleCount).toBe(4);
});

test("normal child store selector", () => {
  const store = tenx({
    state: {},
    computed: {
      doubleCount: ["child.count", (count) => count * 2],
    },
    children: {
      child: {
        state: {
          count: 1,
        },
      },
    },
  });

  expect(store.doubleCount).toBe(2);
  store.child.count++;
  expect(store.doubleCount).toBe(4);
});

test("isolated child store selector", () => {
  const store = tenx({
    state: {},
    computed: {
      doubleCount: ["$child.count", (count) => count * 2],
    },
    children: {
      $child: {
        state: {
          count: 1,
        },
      },
    },
  });

  expect(store.doubleCount).toBe(2);
  store.$child.count++;
  expect(store.$child.count).toBe(2);
  expect(store.doubleCount).toBe(4);
});

test("ui selector", async () => {
  const callback = jest.fn();
  const store = tenx({
    state: {
      count: 1,
    },
    computed: {
      doubleCount: ["count", callback, (count) => count * 2],
    },
  });

  store.count = store.delay(10).then(() => 2);

  expect(store.doubleCount).toBe(2);
  expect(store.doubleCount).toBe(2);

  expect(callback).toBeCalledTimes(1);

  expect(() => {
    try {
      globalContext.render = {};
      return store.doubleCount;
    } finally {
      globalContext.render = undefined;
    }
  }).toThrowError();

  expect(callback).toBeCalledTimes(1);

  await store.delay(25);
  expect(store.doubleCount).toBe(4);
  expect(callback).toBeCalledTimes(2);
  expect(
    (() => {
      try {
        globalContext.render = {};
        return store.doubleCount;
      } finally {
        globalContext.render = undefined;
      }
    })()
  ).toBe(4);
  expect(callback).toBeCalledTimes(3);
});
