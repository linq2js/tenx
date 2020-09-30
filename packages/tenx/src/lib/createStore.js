import createActionContext from "./createActionContext";
import createSelector from "./createSelector";
import createState from "./createState";
import defineProp from "./defineProp";
import globalContext from "./globalContext";
import isEqual from "./isEqual";
import isPromiseLike from "./isPromiseLike";

export default function createStore(
  { computed: computedModel = {}, ...stateModel } = {},
  options = {}
) {
  const props = {};
  const actionContext = createActionContext({
    stateFactory,
    getState,
    getStore() {
      return store;
    },
  });
  const staticStates = {};
  const { when, dispatch, emitter, states, get, watch } = actionContext;
  const selectors = {};
  const displayContext = {
    get(name) {
      return get(name).loadable;
    },
  };
  const store = {
    get state() {
      return getState();
    },
    dispatch,
    when,
    watch,
    get loading() {
      return props.loading;
    },
    get error() {
      return props.error;
    },
    get __displayContext() {
      return displayContext;
    },
  };
  const defaultStateCache = { valueToken: undefined, value: undefined };
  const computedStateCache = {
    valueToken: undefined,
    statusToken: undefined,
    value: undefined,
  };
  let stateValueChangeToken;
  let stateStatusChangeToken;

  function stateFactory(initial) {
    if (typeof initial === "function") {
      return initial(stateFactory(undefined));
    }
    return createState(initial, onStateValueChange, onStateStatusChange);
  }

  function getState() {
    if (
      !defaultStateCache.value ||
      defaultStateCache.valueToken !== stateValueChangeToken
    ) {
      const nextState = buildState(defaultStateCache.value, "value");
      defaultStateCache.valueToken = stateValueChangeToken;
      if (!isEqual(nextState, defaultStateCache.value)) {
        defaultStateCache.value = nextState;
      }
    }
    return defaultStateCache.value;
  }

  function buildState(prev, prop) {
    const next = Object.entries(staticStates).reduce((obj, [name, state]) => {
      obj[name] = state[prop];
      return obj;
    }, {});
    if (isEqual(prev, next)) return prev;
    return next;
  }

  function getStateForComputed() {
    if (globalContext.render) {
      if (
        !computedStateCache.value ||
        computedStateCache.statusToken !== stateStatusChangeToken ||
        computedStateCache.valueToken !== stateValueChangeToken
      ) {
        const nextState = buildState(computedStateCache.value, "displayValue");
        computedStateCache.valueToken = stateValueChangeToken;
        computedStateCache.statusToken = stateStatusChangeToken;
        if (!isEqual(nextState, computedStateCache.value)) {
          computedStateCache.value = nextState;
        }
      }
      return computedStateCache.value;
    }
    return getState();
  }

  function onStateValueChange() {
    stateValueChangeToken = {};
    if (globalContext.updates) {
      globalContext.updates.add(emitChange);
      globalContext.updates.add(emitUpdate);
    } else {
      emitChange();
      emitUpdate();
    }
  }

  function onStateStatusChange() {
    stateStatusChangeToken = {};
    if (globalContext.updates) {
      globalContext.updates.add(emitUpdate);
    } else {
      emitUpdate();
    }
  }

  function emitChange() {
    emitter.emit("change", { store });
  }

  function emitUpdate() {
    emitter.emit("update", { store });
  }

  function resolveSelector(name) {
    let selector = selectors[name];
    if (!selector) {
      const props = name.split(".");
      selectors[name] = selector = function (state, store) {
        return props.reduce((prev, prop) => prev[prop], store);
      };
    }
    return selector;
  }

  Object.entries(stateModel).forEach(([name, initial]) => {
    const state = stateFactory(initial);
    defineProp(actionContext, name, () => state);
    defineProp(displayContext, name, () => state.displayValue);
    defineProp(store, name, () => state.value);
    states[name] = state;
    staticStates[name] = state;
  });

  Object.entries(computedModel).forEach(([name, computed]) => {
    const selector = createSelector(computed, resolveSelector);
    const state = {
      get value() {
        return selector(getStateForComputed(), store);
      },
    };
    let lastHandledPromise;
    defineProp(actionContext, name, () => state);
    defineProp(displayContext, name, () => {
      const value = state.value;
      if (isPromiseLike(value)) {
        if (!lastHandledPromise || lastHandledPromise.original !== value) {
          lastHandledPromise = value
            .then(
              (result) => (value.result = result),
              (error) => (value.error = error)
            )
            .finally(() => (value.done = true));
          lastHandledPromise.original = value;
        }
        if (value.done) {
          if (value.error) throw value.error;
          return value.result;
        }
        throw lastHandledPromise;
      }
      return value;
    });
    defineProp(store, name, () => state.value);
    states[name] = state;
  });

  if (options.init) {
    const result = dispatch(options.init);
    if (isPromiseLike(result) && result.async !== false) {
      props.loading = true;
      result.then(
        () => {
          props.loading = false;
          emitter.emitOnce("ready");
        },
        (error) => {
          props.error = error;
          emitter.emit("error", error);
        }
      );
      store.__initPromise = result;
    }
  }

  return options.component ? actionContext : store;
}
