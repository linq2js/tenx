import createEmitter from "./createEmitter";
import createState from "./createState";
import globalContext from "./globalContext";
import isEqual from "./isEqual";
import isIteratorLike from "./isIteratorLike";
import isPromiseLike from "./isPromiseLike";
import processIterator from "./processIterator";
import { noop } from "./types";
import wrapUpdate from "./wrapUpdate";
import delay from "./extras/delay";
import Yield from "./Yield";

const emptyState = {};

export default function createActionContext({
  stateFactory = createState,
  getState = () => emptyState,
  getStore = noop,
  ...props
} = {}) {
  const taskCache = new WeakMap();
  const emitter = createEmitter();
  const states = {};
  const context = {
    ...props,
    emitter,
    dispatch,
    latest,
    delay,
    debounce,
    fork,
    when,
    watch,
    mutate,
    states,
    get(name) {
      let state = states[name];
      if (!state) {
        state = states[name] = stateFactory();
      }
      return state;
    },
  };

  function watch(selector, listener) {
    if (typeof selector === "string") {
      const prop = selector;
      selector = (state) => state[prop];
    } else if (Array.isArray(selector)) {
      const props = selector;
      selector = (state) => {
        const result = {};
        props.forEach((prop) => (result[prop] = state[prop]));
        return result;
      };
    }

    let previous = selector(getState());

    function subscribe(listener) {
      return emitter.on("change", (args) => {
        const current = selector(getState());
        if (isEqual(current, previous)) return;
        listener({ store: args.store, current, previous });
      });
    }

    if (!listener) {
      let unsubscribe;
      function cancel() {
        unsubscribe && unsubscribe();
      }
      return Object.assign(
        new Promise((resolve) => {
          unsubscribe = subscribe((args) => {
            cancel();
            resolve(args);
          });
        }),
        { cancel }
      );
    }
    return subscribe(listener);
  }

  function mutate(states, values = {}) {
    const isSingleState = typeof states.startUpdate === "function";
    const entries = isSingleState
      ? [["value", states]]
      : Object.entries(states);

    function update(promise, result, error) {
      if (isSingleState) {
        result = {
          value: result,
        };
      }
      wrapUpdate(() => {
        entries.forEach(([key, state]) => {
          if (error) {
            state.endUpdate(promise, undefined, error);
          } else if (key in result) {
            if (promise) {
              state.endUpdate(promise, result[key]);
            } else {
              if (typeof result[key] === "function") {
                result[key](state);
              } else {
                state.value = result[key];
              }
            }
          }
        });
      });
    }

    return wrapUpdate(() => {
      if (isPromiseLike(values)) {
        const promise = values;
        const props = {
          cancelled: false,
        };
        return Object.assign(
          new Promise((resolve, reject) => {
            // lock state
            entries.forEach(([, state]) => state.startUpdate(promise));

            values.then(
              (resolved = {}) => {
                if (props.cancelled) return;
                update(promise, resolved);
                resolve();
              },
              (error) => {
                if (props.cancelled) return;
                update(promise, undefined, error);
                reject(error);
              }
            );
          }),
          {
            cancel() {
              if (props.cancelled) return;
              props.cancelled = true;
            },
          }
        );
      } else {
        update(undefined, values);
      }
    });
  }

  function when(action, listener) {
    if (globalContext.generator) {
      return new Yield("wait", (callback) => {
        if (typeof listener === "undefined") {
          return when(action, callback);
        }
        const unsubscribe = when(action, listener);
        callback(unsubscribe);
        return unsubscribe;
      });
    }

    if (typeof listener === "undefined") {
      let unsubscribe;
      return Object.assign(
        new Promise((resolve) => {
          unsubscribe = when(action, (args) => {
            unsubscribe();
            resolve(args);
          });
        }),
        {
          cancel() {
            unsubscribe && unsubscribe();
          },
        }
      );
    }

    if (typeof action === "string") {
      if (action === "*") {
        return emitter.on("dispatch", listener);
      }
      return emitter.on(action, listener);
    }

    if (Array.isArray(action)) {
      const actions = action;
      return emitter.on("dispatch", (args) => {
        actions.includes(args.action.type) && listener(args);
      });
    }
    return emitter.on("dispatch", (args) => {
      args.action.type === action && listener(args);
    });
  }

  function fork(action, payload) {
    return new Yield("fork", dispatch, [action, payload]);
  }

  function latest() {
    if (!globalContext.generator)
      throw new Error("Must call latest() inside action generator (saga)");

    if (globalContext.generator.last) {
      globalContext.generator.last.cancel();
    }
  }

  function debounce(ms = 0) {
    latest();
    return delay(ms);
  }

  function dispatch(action, payload) {
    if (globalContext.generator) {
      return new Yield("call", dispatch, [action, payload]);
    }
    return wrapUpdate(() => {
      emitter.emit("dispatch", {
        store: getStore(),
        action: { type: action, payload },
      });
      const result = action(context, payload);
      if (isIteratorLike(result)) {
        const props = {
          async: false,
          done: false,
        };

        const promise = new Promise((resolve) => {
          props.handler = processIterator(
            result,
            (result) => {
              props.result = result;
              props.done = true;
              promise.result = result;
              resolve(result);
            },
            {
              last: taskCache.get(action),
            }
          );
        });

        taskCache.set(action, props.handler);
        promise.cancel = props.handler.cancel;
        props.handler.start();
        promise.async = !props.done;

        return promise;
      }

      return result;
    });
  }

  return context;
}
