import createSelector from "./createSelector";
import createState from "./createState";
import dispatchAction from "./dispatchAction";
import createStoreContext from "./createStoreContext";
import addStoreListener from "./addStoreListener";
import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";
import { storeType } from "./types";
import Yield from "./Yield";
import addStoreWatcher from "./addStoreWatcher";

export default function createStore(
  model = {},
  { parent, local, handleAsyncState } = {}
) {
  let context;
  let modelVersion = 0;
  const definedProps = {};
  const store = {
    __type: storeType,
    __local: local,
    __parent: parent,
    get state() {
      return getState();
    },
    set state(value) {
      setState(value);
    },
    get loading() {
      addComputedDependency(getLoading);
      return getLoading();
    },
    get error() {
      addComputedDependency(getError);
      return getError();
    },
    get,
    onChange,
    onDispatch,
    dispatch,
    when,
    delay,
    debounce,
    watch,
    cache,
    __resetHookIndex: resetHookIndex,
  };

  function addComputedDependency(dependency) {
    if (globalContext.computed) {
      globalContext.computed.addDependency(dependency);
    }
  }

  function resetHookIndex() {
    context.cache.hookIndex = 0;
  }

  function cache(item, ...keys) {
    const cache = globalContext.render
      ? globalContext.render.cache
      : context.cache;
    cache.hookIndex++;
    return cache.getOrAdd([cache.hookIndex].concat(keys), () => item);
  }

  function getLoading() {
    return context.loading;
  }

  function getError() {
    return context.error;
  }

  function defineProp(name, get, set) {
    let meta = definedProps[name];
    if (meta) {
      if (modelVersion === defineProp.modelVersion) {
        throw new Error(`The ${name} property is in use`);
      }
      meta.modelVersion = modelVersion;
      meta.get = get;
      meta.set = set;
    } else {
      meta = definedProps[name] = { get, set, modelVersion };
      Object.defineProperty(store, name, {
        get() {
          return meta.get();
        },
        set(value) {
          if (!meta.set) {
            throw new Error(`The ${name} property has no setter`);
          }
          return meta.set(value);
        },
        enumerable: false,
      });
    }
  }

  function setStateAction(_, nextState) {
    let hasChange = false;
    Object.entries(nextState).forEach(([name, value]) => {
      if (name in context.stateEntries) {
        const stateEntry = context.stateEntries[name];
        if (stateEntry.value !== value || stateEntry.status === "loading") {
          stateEntry.value = value;
          hasChange = true;
        }
      }
      // ignore update if child store is isolated
      else if (name.charAt(0) !== "$" && name in context.childStores) {
        const childStore = context.childStores[name];
        if (!childStore.__isolated) {
          childStore.state = value;
        }
      }
    });
    if (hasChange) {
      context.onStateChanged();
    }
  }

  function setState(nextState) {
    dispatchAction(
      store,
      context,
      "@store.setState",
      setStateAction,
      nextState
    );
  }

  function getState() {
    if (!context.stateObject) {
      const stateObject = (context.stateObject = {});
      Object.entries(context.staticStates).forEach(([name, stateEntry]) => {
        stateObject[name] = stateEntry.value;
      });
      Object.entries(context.childStores).forEach(([name, childStore]) => {
        Object.defineProperty(stateObject, name, {
          get() {
            return childStore.state;
          },
          enumerable: true,
        });
      });
    }
    return context.stateObject;
  }

  function get(name) {
    let stateEntry = context.stateEntries[name];
    if (!stateEntry) {
      context.stateEntries[name] = stateEntry = createState(
        undefined,
        context.onStateChanged,
        context.onAsyncStateChanged,
        handleAsyncState
      );
    }
    return stateEntry;
  }

  function resolveSelector(name, forUi) {
    const selectors = forUi ? context.uiSelectors : context.defaultSelectors;
    let selector = selectors[name];
    if (!selector) {
      const parts = name.split(".");
      if (parts.length === 1) {
        const prop = parts[0];
        selector = (state, store) => store[prop];
      } else {
        selector = (state, store) =>
          parts.reduce((prev, prop) => prev[prop], store);
      }
      selectors[name] = selector;
    }
    return selector;
  }

  function applyModel(nextModel) {
    context = createStoreContext(store);
    store.__isolated = nextModel.isolated;

    modelVersion++;
    if (nextModel.state) {
      Object.entries(nextModel.state).forEach(([name, initial]) => {
        const stateEntry = createState(
          initial,
          context.onStateChanged,
          context.onAsyncStateChanged,
          handleAsyncState
        );
        context.staticStates[name] = context.stateEntries[name] = stateEntry;
        defineProp(
          name,
          () => stateEntry.value,
          (value) => (stateEntry.value = value)
        );
      });
    }

    if (nextModel.computed) {
      Object.entries(nextModel.computed).forEach(([name, computed]) => {
        const defaultSelector = createSelector(computed, (name) =>
          resolveSelector(name, false)
        );
        const uiSelector = createSelector(computed, (name) =>
          resolveSelector(name, true)
        );
        const dependencySet = new WeakSet();
        const dependencyArray = [];

        function addDependency(dependency) {
          if (dependencySet.has(dependency)) return;
          dependencySet.add(dependency);
          dependencyArray.push(dependency);
        }

        context.defaultSelectors[name] = defaultSelector;
        context.uiSelectors[name] = uiSelector;

        function get() {
          const selector = globalContext.render ? uiSelector : defaultSelector;
          const prevComputed = globalContext.computed;
          try {
            globalContext.computed = { addDependency };
            const args = [getState(), store].concat(
              dependencyArray.map((x) => x())
            );
            return selector(...args);
          } finally {
            globalContext.computed = prevComputed;
          }
        }

        // const accessor = {
        //   get value() {
        //     return get();
        //   },
        // };

        if (name.charAt(0) !== "_") {
          defineProp(name, () => {
            return get();
          });
        }
      });
    }

    if (nextModel.action) {
      Object.entries(nextModel.action).forEach(([name, fn]) => {
        const dispatcher = (payload) => {
          return dispatchAction(store, context, name, fn, payload);
        };
        dispatcher.fork = (payload) => {
          return new Yield("fork", dispatcher, [payload]);
        };
        defineProp(name, () => dispatcher);
      });
    }

    if (nextModel.watch) {
      Object.entries(nextModel.watch).forEach(([key, callback]) => {
        const props = key.split(",");
        if (props.length > 1) {
          addStoreWatcher(store, context, props, callback);
        } else {
          addStoreWatcher(store, context, props[0], callback);
        }
      });
    }

    // child store initializing phase must be called at end of parent store initializing phase
    if (nextModel.children) {
      Object.entries(nextModel.children).forEach(([name, childModel]) => {
        const childStore = createStore(childModel, { parent: store });
        const isolated = name.charAt(0) === "$" || childStore.__isolated;
        const getChildState = () => childStore.state;
        defineProp(name, () => {
          isolated && addComputedDependency(getChildState);
          return childStore;
        });

        if (!isolated) {
          context.childStores[name] = childStore;
          childStore.onChange(context.onStateChanged);
        }
      });
    }

    try {
      context.loading = true;
      const result = dispatch("init", { parent });
      if (isPromiseLike(result)) {
        if (result.async !== false) {
          store.__loadingPromise = result;
          result.then(
            () => {
              context.loading = false;
            },
            (error) => {
              context.error = error;
            }
          );
        } else {
          context.loading = false;
        }
      } else {
        context.loading = false;
      }
    } catch (error) {
      context.error = error;
    }
  }

  function dispatchUnboundedAction(action, payload) {
    context.emitter.emit("dispatch", {
      store,
      action: { type: action, payload },
    });
  }

  function dispatch(action, payload) {
    if (typeof action === "string") {
      if (action in store) {
        return store[action](payload);
      }
      return dispatchUnboundedAction(action, payload);
    }
    if (typeof action === "function") {
      return dispatchAction(
        store,
        context,
        action.displayName || action.name,
        action,
        payload
      );
    }
    if (typeof action === "object") {
      if (action.type in store) {
        return store[action.type](action.payload);
      }
      return dispatchUnboundedAction(action.type, action.payload);
    }
    throw new Error("Invalid action");
  }

  function when(event, listener) {
    return addStoreListener(store, context, event, listener);
  }

  function watch(selector, callback) {
    return addStoreWatcher(store, context, selector, callback);
  }

  function onChange(listener) {
    return context.emitter.on("change", listener);
  }

  function delay(ms = 0) {
    let timerId;
    const promise = new Promise(
      (resolve) => (timerId = setTimeout(resolve, ms))
    );
    promise.cancel = () => clearTimeout(timerId);
    if (globalContext.generator) {
      return new Yield("wait", promise);
    }
    return promise;
  }

  function debounce(ms = 0) {
    if (!globalContext.generator)
      throw new Error("Must call debounce() inside action generator (saga)");
    if (globalContext.generator.last) {
      globalContext.generator.last.cancel();
    }
    return delay(ms);
  }

  function onDispatch(listener) {
    return context.emitter.on("dispatch", listener);
  }

  applyModel(model);

  return store;
}
