import isEqual from "../isEqual";

export default function snapshot() {
  let create, revert, options;
  if (typeof arguments[0] === "string") {
    options = arguments[1];
    const prop = arguments[0];
    create = (store) => store[prop];
    revert = (store, state) => (store[prop] = state);
  } else if (Array.isArray(arguments[0])) {
    options = arguments[1];
    const props = arguments[0];
    create = (store) => {
      const state = {};
      props.forEach((prop) => (state[prop] = store[prop]));
      return state;
    };
    revert = (store, state) => {
      props.forEach((prop) => (store[prop] = state[prop]));
    };
  } else {
    create = (store) => store.state;
    revert = (store, state) => (store.state = state);
  }

  const { maxLength = 0, autoCreate = true, skipInitial = false } =
    options || {};

  return {
    isolated: true,
    state: {
      all: [],
      index: -1,
    },
    computed: {
      current(state) {
        return state.all[state.index];
      },
      next(state) {
        return state.all[state.index + 1];
      },
      prev(state) {
        return state.all[state.index - 1];
      },
      nextAll(state) {
        return state.all.slice(state.index + 1);
      },
      prevAll(state) {
        return state.all.slice(0, state.index);
      },
    },
    action: {
      init(store, { parent }) {
        if (!parent) throw new Error("Snapshot store requires parent store");
        if (!skipInitial) {
          store.create();
        }
        if (autoCreate) {
          parent.onChange(() => store.create());
        }
      },
      create(store) {
        const currentState = store.current;
        if (store.__reverting) {
          return false;
        }
        const nextState = create(store.__parent);
        if (currentState && isEqual(nextState, currentState)) {
          return false;
        }
        const all = store.all.slice(0, store.index + 1).concat([nextState]);
        let index = store.index + 1;
        if (maxLength && all.length > maxLength) {
          all.shift();
          index--;
        }
        store.all = all;
        store.index = index;
        return true;
      },
      revert(store, index) {
        try {
          store.__reverting = true;
          if (index < 0 || index >= store.all.length) return false;
          store.index = index;
          revert(store.__parent, store.all[index]);
        } finally {
          delete store.__reverting;
        }
        return true;
      },
      go(store, number) {
        return store.revert(store.index + number);
      },
      back(store) {
        return store.revert(store.index - 1);
      },
      forward(store) {
        return store.revert(store.index + 1);
      },
      clear(store) {
        store.index = -1;
        store.all = [];
      },
    },
  };
}
