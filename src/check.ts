import tenx, { Action, Computed, State, WatchArgs } from "./index";
import hookFactory from "./react";

interface CounterStoreModel {
  count: State<number>;
  increase: Action<number, number>;
  doubleCount: Computed<number>;
}

const store = tenx<CounterStoreModel>({
  state: {
    count: 10,
  },
  computed: {
    doubleCount() {
      return 100;
    },
  },
  action: {
    increase(store, payload) {
      console.log(store.state, payload);
      return 1;
    },
  },
  when: {
    click(args) {
      console.log(args.store);
    },
  },
  watch: {
    "count,doubleCount"(
      args: WatchArgs<CounterStoreModel, { count: number; doubleCount: number }>
    ) {
      console.log(args.current.doubleCount);
    },
  },
});

const useMyStore = hookFactory.shared(store);
const useOtherStore = hookFactory.component<CounterStoreModel>({
  state: {
    count: 10,
  },
  computed: {
    doubleCount() {
      return 100;
    },
  },
  action: {
    increase(store, payload) {
      console.log(store, payload);
      return 1;
    },
  },
  when: {
    click(args) {
      console.log(args.store);
    },
  },
  watch: {
    "count,doubleCount"(
      args: WatchArgs<CounterStoreModel, { count: number; doubleCount: number }>
    ) {
      console.log(args.current.doubleCount);
    },
  },
});

function App() {
  const result1 = useMyStore((store) => ({
    doubleCount: store.doubleCount,
  }));
  const result2 = useOtherStore();
  console.log(result1.doubleCount, result2.doubleCount);
}

console.log(
  App,
  store.watch(
    (x) => x.count,
    (a) => a.current
  ),
  store.watch(
    (x) => ({ a: x.count, y: x.doubleCount }),
    (x) => x.current.a
  ),
  store.watch("count"),
  store.watch("count", (a) => a.current),
  store.when("aaa").then,
  store.when("aaa", () => {}),
  store.delay(100),
  store.dispatch("increase2"),
  store.dispatch("count"),
  store.count,
  store.doubleCount,
  store.increase(),
  store.increase.fork,
  store.state.count,
  store.state.doubleCount
);
