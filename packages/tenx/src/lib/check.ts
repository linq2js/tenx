import tenx, { StoreContext, State } from "./index";
import {
  ArrayState,
  entitySet,
  EntitySetState,
  EntityState,
  snapshot,
} from "../extras";
import { componentStore } from "../react";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

const useCompStore = componentStore({ count: 0 });
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
const counterStore = tenx(model);
model.computed.doubleCount2.lastIndexOf("1");
const counterSnapshot1 = snapshot(counterStore, "count");
const counterSnapshot2 = snapshot<{ count: number; doubleCount: number }>(
  counterStore,
  ["count", "doubleCount"]
);

function Add(
  {
    count,
    todos,
    todos2,
    data,
  }: StoreContext<{
    count: State<number>;
    todos: ArrayState<string>;
    todos2: EntitySetState<Todo, string>;
    data: EntityState<{ [_: string]: any }>;
  }>,
  _: number
) {
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

  const { count: count1 } = useCompStore();
  console.log(count1.value);

  return 1;
}

function* Saga() {
  return 100;
}

console.log(
  counterSnapshot1.current.toExponential(),
  counterSnapshot2.current.count.toExponential(),
  counterSnapshot2.current.doubleCount.toExponential(),
  counterStore.get<number>("name").loadable.value,
  counterStore.watch("count", function (args) {
    return args.current + 1;
  }),
  counterStore.doubleCount.toExponential(),
  counterStore.doubleCount2.toExponential(),
  counterStore.count,
  counterStore.todos.length,
  counterStore.todos.map((x) => x),
  counterStore.state.count,
  counterStore.data.name,
  counterStore.dispatch(Add),
  counterStore.dispatch(Add, 100).toExponential(),
  counterStore.dispatch(Saga).cancel(),
  counterStore.dispatch(Saga).async,
  counterStore.dispatch(Saga).result,
  counterStore.when("*", (args) => args.action.type).length
);
