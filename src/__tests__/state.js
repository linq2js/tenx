import tenx from "../index";

test("mutate single state", () => {
  const events = [];
  const store = tenx({
    count: 0,
  });
  const Increase = ({ count }, by = 1) => {
    count.value += by;
  };
  store.when("dispatch", () => events.push("dispatch"));
  store.when("change", () => events.push("change"));
  store.when("update", () => events.push("update"));
  store.dispatch(Increase, 1);
  store.dispatch(Increase, 2);
  expect(events).toEqual([
    "dispatch",
    "change",
    "update",
    "dispatch",
    "change",
    "update",
  ]);
  expect(store.state).toEqual({
    count: 3,
  });
});

test("nested action dispatching", () => {
  const store = tenx({
    count: 0,
  });
  const Increase = ({ count }) => count.value++;
  const Triple = ({ dispatch }) => {
    dispatch(Increase);
    dispatch(Increase);
    dispatch(Increase);
  };
  const events = [];
  store.when("dispatch", () => events.push("dispatch"));
  store.when("change", () => events.push("change"));
  store.when("update", () => events.push("update"));
  store.dispatch(Triple, 1);
  expect(events).toEqual([
    "dispatch", // increase
    "dispatch", // increase
    "dispatch", // increase
    "dispatch", // increase
    "change",
    "update",
  ]);
  expect(store.state).toEqual({
    count: 3,
  });
});

test("mutate multiple states", () => {
  const store = tenx({
    value1: 1,
    value2: 2,
    value3: 3,
  });
  const ChangeValues = ({ mutate, value1, value2, value3 }, payload) => {
    mutate(
      {
        value1,
        value2,
      },
      payload
    );
  };
  const events = [];
  store.when("dispatch", () => events.push("dispatch"));
  store.when("change", () => events.push("change"));
  store.when("update", () => events.push("update"));

  store.dispatch(ChangeValues, {});
  expect(events).toEqual(["dispatch"]);

  store.dispatch(ChangeValues, { value1: 2, value2: 2 });
  expect(events).toEqual(["dispatch", "dispatch", "change", "update"]);

  store.dispatch(ChangeValues, { value1: 2, value2: 2 });
  expect(events).toEqual([
    "dispatch",
    "dispatch",
    "change",
    "update",
    "dispatch",
  ]);
});

test("enhancer", () => {
  const array = (initial = []) => (state) => {
    state.value = initial;

    state.push = (value) => {
      state.value = state.value.concat(value);
    };

    return state;
  };
  const store = tenx({
    todos: array(["item 1"]),
  });

  const add = ({ todos }, title) => todos.push(title);

  expect(store.todos).toEqual(["item 1"]);
  store.dispatch(add, "item 2");
  store.dispatch(add, "item 3");
  expect(store.todos).toEqual(["item 1", "item 2", "item 3"]);
});
