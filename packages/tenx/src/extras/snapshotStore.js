import createStore from "../lib";
import isEqual from "../lib/isEqual";

export default function snapshotStore(
  targetStore,
  prop,
  { maxLength, skipInitial } = {}
) {
  let backup, revert;
  if (Array.isArray(prop)) {
    const props = prop;
    backup = (store) => {
      const result = {};
      props.forEach((p) => {
        result[p] = store[p];
      });
      return result;
    };
    revert = (store, state) => {
      store.dispatch((context) => {
        props.forEach((p) => {
          context[p].value = state[p];
        });
      });
    };
  } else {
    backup = (store) => {
      return store[prop];
    };
    revert = (store, state) => {
      store.dispatch((context) => {
        context[prop].value = state;
      });
    };
  }

  function BackupAction({ all, index }, payload) {
    all.value = all.value.slice(0, index.value + 1).concat([payload]);
    index.value++;
    if (maxLength && all.value.length >= maxLength) {
      index.value--;
    }
  }

  function RevertAction({ index, all }, inputIndex) {
    if (
      inputIndex < 0 ||
      inputIndex >= all.value.length ||
      inputIndex === index.value
    )
      return false;
    index.value = inputIndex;
    revert(targetStore, all.value[inputIndex]);
  }

  function ClearAction({ all, index }) {
    if (!all.value.length) return;
    all.value = [];
    index.value = -1;
  }

  const store = createStore(
    {
      all: [],
      index: -1,
      computed: {
        current: ["all", "index", (all, index) => all[index]],
        prev: ["all", "index", (all, index) => all[index - 1]],
        next: ["all", "index", (all, index) => all[index + 1]],
        prevAll: ["all", "index", (all, index) => all.slice(0, index)],
        nextAll: ["all", "index", (all, index) => all.slice(index + 1)],
      },
    },
    {
      init({ dispatch }) {
        let previous = backup(targetStore);
        if (!skipInitial) {
          dispatch(BackupAction, previous);
        }
        targetStore.when("update", () => {
          const current = backup(targetStore);
          if (
            isEqual(current, previous) ||
            isEqual(current, store.all[store.index])
          )
            return;
          dispatch(BackupAction, current);
          previous = current;
        });
      },
    }
  );

  return Object.assign(store, {
    revert: store.dispatch.get(RevertAction),
    go: (number) => store.revert(store.index + number),
    back: () => store.revert(store.index - 1),
    forward: () => store.revert(store.index + 1),
    clear: () => store.dispatch(ClearAction),
  });
}
