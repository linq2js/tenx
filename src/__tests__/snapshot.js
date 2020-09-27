import tenx from "../index";
import snapshot from "../snapshot";

const model = {
  state: {
    count1: 1,
    count2: 2,
    count3: 3,
  },
};

test("single prop", () => {
  const store = tenx({
    ...model,
    children: {
      snapshot: snapshot("count1"),
    },
  });

  expect(store.snapshot.all).toEqual([1]);

  store.count1++;

  expect(store.snapshot.all).toEqual([1, 2]);
});

test("multiple props", () => {
  const store = tenx({
    ...model,
    children: {
      snapshot: snapshot(["count1", "count2"]),
    },
  });

  expect(store.snapshot.all).toEqual([{ count1: 1, count2: 2 }]);

  store.count1++;
  store.count2++;

  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2 },
    { count1: 2, count2: 2 },
    { count1: 2, count2: 3 },
  ]);

  store.count3++;

  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2 },
    { count1: 2, count2: 2 },
    { count1: 2, count2: 3 },
  ]);
});

test("whole state", () => {
  const store = tenx({
    ...model,
    children: {
      snapshot: snapshot(),
    },
  });

  expect(store.snapshot.all).toEqual([{ count1: 1, count2: 2, count3: 3 }]);

  store.count1++;
  store.count2++;

  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2, count3: 3 },
    { count1: 2, count2: 2, count3: 3 },
    { count1: 2, count2: 3, count3: 3 },
  ]);

  store.count3++;

  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2, count3: 3 },
    { count1: 2, count2: 2, count3: 3 },
    { count1: 2, count2: 3, count3: 3 },
    { count1: 2, count2: 3, count3: 4 },
  ]);
});

test("actions", () => {
  const store = tenx({
    ...model,
    action: {
      increase(store, by = 1) {
        store.count1 += by;
        store.count2 += by;
        store.count3 += by;
      },
    },
    children: {
      snapshot: snapshot(),
    },
  });

  store.increase();

  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2, count3: 3 },
    { count1: 2, count2: 3, count3: 4 },
  ]);

  store.increase();

  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2, count3: 3 },
    { count1: 2, count2: 3, count3: 4 },
    { count1: 3, count2: 4, count3: 5 },
  ]);

  store.snapshot.back();
  expect(store.snapshot.current).toEqual({ count1: 2, count2: 3, count3: 4 });
  expect(store.state).toEqual({ count1: 2, count2: 3, count3: 4 });
  expect(store.snapshot.index).toBe(1);

  store.snapshot.back();
  expect(store.snapshot.current).toEqual({ count1: 1, count2: 2, count3: 3 });
  expect(store.state).toEqual({ count1: 1, count2: 2, count3: 3 });
  expect(store.snapshot.index).toBe(0);

  store.snapshot.forward();
  expect(store.snapshot.current).toEqual({ count1: 2, count2: 3, count3: 4 });
  expect(store.state).toEqual({ count1: 2, count2: 3, count3: 4 });
  expect(store.snapshot.index).toBe(1);

  store.increase(2);
  expect(store.snapshot.all).toEqual([
    { count1: 1, count2: 2, count3: 3 },
    { count1: 2, count2: 3, count3: 4 },
    { count1: 4, count2: 5, count3: 6 },
  ]);
  expect(store.snapshot.index).toBe(2);

  store.snapshot.clear();
  expect(store.snapshot.all).toEqual([]);
  expect(store.snapshot.index).toBe(-1);
});
