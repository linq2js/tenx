import tenx, { StoreContext, MutableState } from "./index";
import {
  ArrayState,
  entitySet,
  EntitySetState,
  EntityState,
  snapshot,
} from "../extras";
import { componentStore, useStore } from "../react";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

const useCompStore = componentStore(
  { count: 0 },
  {
    increase({ count }: StoreContext, by: number) {
      return 100;
    },
  }
);
const model = {
  count: 0,
  todos: undefined as ArrayState<string>,
  data: undefined as EntityState<{ [key: string]: any }>,
  todos2: entitySet(undefined as Todo[], (todo) => todo.id),
  computed: {
    doubleCount(state): number {
      return state.count * 2;
    },
    doubleCount2: ["count", "count2", () => 100],
  },
};
const counterStore = tenx(model, {
  alert(context: StoreContext) {},
});
model.computed.doubleCount2.lastIndexOf("1");
const counterSnapshot1 = snapshot(counterStore, "count");
const counterSnapshot2 = snapshot<{ count: number; doubleCount: number }>(
  counterStore,
  ["count", "doubleCount"]
);
const counterSnapshot3 = snapshot(counterStore);
const counterSnapshot4 = snapshot(counterStore, {});

function App() {
  const { count, alert } = useStore(
    counterStore,
    (state, { callback, alert }) => {
      return {
        count: state.count,
        alert: alert,
      };
    }
  );

  console.log(count.toExponential(), alert.length);
}

function Add(
  {
    count,
    todos,
    todos2,
    data,
    state,
    increase2,
  }: StoreContext<{
    count: MutableState<number>;
    todos: ArrayState<string>;
    todos2: EntitySetState<Todo, string>;
    data: EntityState<{ [_: string]: any }>;
    increase2(): void;
  }>,
  _: number
) {
  state.value = 100;
  count.value++;
  todos.push("aaa");
  data.unset("");
  todos2.merge({
    id: "111",
  });
  todos2.update({
    id: "111",
    completed: true,
    title: "aaa",
  });

  const { count: count1, increase, callback } = useCompStore();
  const a = callback(() => increase(1));
  console.log(count1.value, increase(111).toExponential(), a.caller, increase);

  return 1;
}

function* Saga() {
  return 100;
}

console.log(
  counterSnapshot1.current.toExponential(),
  counterSnapshot2.current.count.toExponential(),
  counterSnapshot2.current.doubleCount.toExponential(),
  counterSnapshot3.current.count,
  counterSnapshot3.current.todos,
  counterSnapshot4.current.todos,
  counterSnapshot4.current.todos2.map((entity) => {
    return { title: "" };
  }),
  counterSnapshot4.current.count,
  counterStore.alert(),
  counterStore.get<number>("name").loadable.value,
  counterStore.watch("count", function (args) {
    return args.current + 1;
  }),
  counterStore.doubleCount.toExponential(),
  counterStore.doubleCount2.toExponential(),
  counterStore.count,
  counterStore.todos.length,
  counterStore.todos.map((x) => x),
  counterStore.todos2.entities,
  counterStore.state.count,
  counterStore.data.name,
  counterStore.dispatch(Add),
  counterStore.dispatch(Add, 100).toExponential(),
  counterStore.dispatch(Saga).cancel(),
  counterStore.dispatch(Saga).async,
  counterStore.dispatch(Saga).result,
  counterStore.when("*", (args) => args.action.type).length
);
