import delay from "../extras/delay";
import tenx from "../lib";

test("mutate single state", () => {
  const store = tenx({ count: 0 });
  store.dispatch(({ count, mutate }) => mutate(count, 100));
  expect(store.count).toBe(100);
});

test("mutate multiple states", () => {
  const store = tenx({ count1: 0, count2: 1 });
  store.dispatch(({ count1, count2, mutate }) =>
    mutate({ count1, count2 }, { count1: 100, count2: 101 })
  );
  expect(store.count1).toBe(100);
  expect(store.count2).toBe(101);
});

test("mutate async", async () => {
  const store = tenx({ count1: 0, count2: 1 });
  store.dispatch(({ count1, count2, mutate, delay }) =>
    mutate({ count1, count2 }, delay(10, { count1: 100, count2: 101 }))
  );
  expect(store.count1).toBe(0);
  expect(store.count2).toBe(1);
  await delay(15);
  expect(store.count1).toBe(100);
  expect(store.count2).toBe(101);
});

test("mutate async using custom mutation", async () => {
  const store = tenx({ count1: 0, count2: 1 });
  store.dispatch(({ count1, count2, mutate, delay }) =>
    mutate(
      { count1, count2 },
      delay(10, {
        count1: 100,
        count2(state) {
          state.value = 1000;
        },
      })
    )
  );
  expect(store.count1).toBe(0);
  expect(store.count2).toBe(1);
  await delay(15);
  expect(store.count1).toBe(100);
  expect(store.count2).toBe(1000);
});
