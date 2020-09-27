import tenx from "../index";

const model = {
  state: {
    count: 0,
  },
};

let store;

beforeEach(() => {
  store = tenx(model);
});

test("mutate state", () => {
  store.count++;
  expect(store.count).toBe(1);
  store.get("count").value++;
  expect(store.count).toBe(2);
});

test("get state", () => {
  const s1 = store.state;
  store.count++;
  const s2 = store.state;
  expect(s1).not.toBe(s2);
  expect(s1).toEqual({ count: 0 });
  expect(s2).toEqual({ count: 1 });
});

test("sync dynamic state", () => {
  const ds = store.get("something");
  expect(ds.value).toBeUndefined();
  ds.value = 100;
  expect(ds.value).toBe(100);
});

test("async dynamic state", async () => {
  const ds = store.get("something");
  expect(ds.value).toBeUndefined();
  ds.mutate(store.delay(10).then(() => 1));
  expect(ds.value).toBeUndefined();
  await store.delay(15);
  expect(ds.value).toBe(1);

  ds.mutate(store.delay(10).then(() => 1));
  ds.mutate(store.delay(5).then(() => 2));
  await store.delay(15);
  expect(ds.value).toBe(2);
});

test("optimize change emitting", () => {
  const callback = jest.fn();
  const store = tenx({
    state: {
      count1: 1,
      count2: 2,
    },
    action: {
      increase(store) {
        store.count1++;
        store.count2++;
      },
    },
  });

  store.onChange(callback);
  store.count1++;
  store.count2++;
  expect(callback).toBeCalledTimes(2);
  store.increase();
  expect(callback).toBeCalledTimes(3);
});
