import delay from "../extras/delay";
import tenx from "../index";

test("lazy init (success)", async () => {
  const store = tenx(
    {},
    {
      async init() {
        await delay(10);
      },
    }
  );

  expect(store.loading).toBe(true);
  await delay(15);
  expect(store.loading).toBe(false);
});

test("lazy init (error)", async () => {
  const store = tenx(
    {},
    {
      async init() {
        await delay(10);
        throw "failed";
      },
    }
  );

  expect(store.loading).toBe(true);
  await delay(15);
  expect(store.loading).toBe(true);
  expect(store.error).toBe("failed");
});
