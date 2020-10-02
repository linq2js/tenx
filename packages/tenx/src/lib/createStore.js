import delay from "../extras/delay";
import shallowMemo from "../extras/shallowMemo";
import createStoreContext from "./createStoreContext";
import createArrayKeyedMap from "./createArrayKeyedMap";
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
  const storeContext = createStoreContext({
    stateFactory,
    getState,
    getStore() {
      return store;
    },
  });
  const staticStates = {};
  const { when, dispatch, emitter, states, get, watch } = storeContext;
  const selectors = {};
  const cachedMethodInvokings = {};
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

  function resolvePropValue(obj, prop) {
    // is method invoking
    if (prop.charAt(prop.length - 1) === ")") {
      let cachedMethodInvoking = cachedMethodInvokings[prop];
      if (!cachedMethodInvoking) {
        const [method, rawArgs] = prop.split(/[()]/)[1];
        cachedMethodInvoking = cachedMethodInvokings[prop] = {
          method,
          args: rawArgs.split(",").map((x) => x.trim()),
        };
      }
      return obj[cachedMethodInvoking.method](...cachedMethodInvoking.args);
    }
    return obj[prop];
  }

  function resolveSelector(name) {
    let selector = selectors[name];
    if (!selector) {
      const props = name.match(/(\([^)]*\)|[^.])+/g);
      selectors[name] = selector = function (state, store) {
        return props.reduce(
          (prev, prop) => resolvePropValue(prev, prop),
          store
        );
      };
    }
    return selector;
  }

  resolveSelector.thunk = function (fn, lastResult) {
    let cache;
    let cancelled = false;
    const onCancel = [];
    const context = {
      latest() {
        lastResult && lastResult.cancel && lastResult.cancel();
      },
      delay(ms) {
        const promise = delay(ms);
        promise.cancel && onCancel.push(promise.cancel);
        return promise;
      },
      debounce(ms) {
        context.latest();
        return context.delay(ms);
      },
      cancel() {
        if (cancelled) return;
        cancelled = true;
        onCancel.forEach((x) => x());
      },
      cache(input) {
        if (typeof arguments[0] === "function") {
          if (!cache) {
            cache = createArrayKeyedMap();
            return cache.getOrAdd(Array.from(arguments).slice(1), input);
          }
          return;
        }
        if (isPromiseLike(lastResult)) {
          handlePromiseStatuses(lastResult);
          if (lastResult.loading || lastResult.error) return input;
          return shallowMemo(lastResult.result, input);
        }
        return shallowMemo(lastResult, input);
      },
    };

    const result = fn(context);
    if (isPromiseLike(result)) {
      if (result.cancel) onCancel.push(result.cancel);
      result.cancel = context.cancel;
      handlePromiseStatuses(result);
    }

    return result;
  };

  Object.entries(stateModel).forEach(([name, initial]) => {
    const state = stateFactory(initial);
    defineProp(storeContext, name, () => state);
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
    defineProp(storeContext, name, () => state);
    defineProp(displayContext, name, () => {
      const value = state.value;
      if (isPromiseLike(value)) {
        if (!lastHandledPromise || lastHandledPromise.original !== value) {
          lastHandledPromise = handlePromiseStatuses(value);
          lastHandledPromise.original = value;
        }
        if (value.loading) throw lastHandledPromise;
        if (value.error) throw value.error;
        return value.result;
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

  return options.component ? storeContext : store;
}

function handlePromiseStatuses(value) {
  if (value.__statusHandlerRegistered) return value;
  value.__statusHandlerRegistered = true;
  value.loading = true;
  return value.then(
    (result) => {
      value.loading = false;
      value.result = result;
      return result;
    },
    (error) => {
      value.loading = false;
      value.error = error;
      throw error;
    }
  );
}
