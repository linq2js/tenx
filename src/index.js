import isPromiseLike from "./isPromiseLike";
import createEmitter from "./createEmitter";
import shallowEqual from "./shallowEqual";
import createMatcher from "./createMatcher";

const defaultSettings = {
  asyncActions: {
    loading: "async.loading",
    success: "async.success",
    error: "async.error",
    done: false,
  },
};

function init(hooks = {}) {
  if (!hooks.emitter) {
    hooks.emitter = createEmitter();
  }

  hooks.settings = Object.assign({}, defaultSettings, hooks.settings);

  hooks.dispatchingCount = 0;

  return Object.assign(hooks, {
    cleanup() {
      hooks.emitter.clear();
    },
    $(input, options) {
      if (!arguments.length) return hooks;
      if (!input) throw new Error("Invalid input");
      if (typeof input === "function") {
        if (typeof options === "function") {
          return hooks.watch(input, options);
        }
        return hooks.binding(input, options);
      }
      if (typeof input === "string") {
        if (typeof options === "function") {
          return hooks.on({ type: input, handler: options });
        }
        return hooks.dispatch({ type: input, payload: options });
      }
      if (Array.isArray(input)) return hooks.async("all", input, options);
      if (typeof input === "object") return hooks.async("race", input, options);
    },
    async(type, input, callback) {
      const entries = Object.entries(input);
      const actionListeners = [];
      const results = type === "race" ? {} : [];
      let doneCount = 0;
      let removeListener;
      let isDone = false;

      function cancel() {
        if (isDone) return;
        isDone = true;
        dispose();
      }

      function dispose() {
        removeListener && removeListener();
      }

      function handleDone(key, value, error) {
        if (isDone) return;
        if (error) {
          isDone = true;
          dispose();
          return;
        }
        if (type === "all") {
          doneCount++;
          if (doneCount === entries.length) isDone = true;
        } else {
          isDone = true;
        }
        results[key] = value;
        if (!isDone) return;
        callback(results);
        dispose();
      }

      entries.forEach(([key, action]) => {
        if (typeof action === "string") {
          actionListeners.push({ key, matcher: createMatcher(action) });
        } else if (isPromiseLike(action)) {
          action.then(
            (value) => handleDone(key, value),
            (error) => handleDone(key, undefined, error)
          );
        }
      });

      if (actionListeners.length) {
        removeListener = hooks.emitter.on("dispatch", (action) => {
          actionListeners.some((listener) => {
            if (listener.matcher(action.type)) {
              handleDone(listener.key, action);
              return true;
            }
            return false;
          });
        });
      }

      if (callback) return cancel;
      return Object.assign(
        new Promise((resolve) => {
          callback = resolve;
        }),
        {
          cancel,
          dispose,
        }
      );
    },

    dispatch(action) {
      try {
        hooks.dispatchingCount++;
        hooks.emitter.emit("dispatch", action);
        hooks.emitter.emit("watch");
      } finally {
        hooks.dispatchingCount--;
        if (!hooks.dispatchingCount) {
          hooks.emitter.emit("render");
        }
      }
    },
    on({ type, handler }) {
      if (type.charAt(0) === "#") {
        return hooks.emitter.on(type.substr(1), handler);
      }
      const matcher = createMatcher(type);
      return hooks.emitter.on("dispatch", (action) => {
        if (!matcher(action.type)) return;
        const result = handler(action);
        if (isPromiseLike(result)) {
          const promise = result;

          const dispatchDone =
            hooks.settings.asyncActions.done &&
            (() =>
              hooks.dispatch({
                type: hooks.settings.asyncActions.done,
                payload: undefined,
                action,
                promise,
              }));

          hooks.settings.asyncActions.loading &&
            hooks.dispatch({
              type: hooks.settings.asyncActions.loading,
              payload: undefined,
              action,
              promise,
            });
          result.then(
            (payload) => {
              hooks.settings.asyncActions.success &&
                hooks.dispatch({
                  type: hooks.settings.asyncActions.success,
                  payload,
                  action,
                  promise,
                });
              dispatchDone && dispatchDone();
            },
            (error) => {
              hooks.settings.asyncActions.error &&
                hooks.dispatch({
                  type: hooks.settings.asyncActions.error,
                  payload: error,
                  promise,
                });
              dispatchDone && dispatchDone();
            }
          );
        }
      });
    },
    watch(selector, handler) {
      let prev = selector();
      return hooks.emitter.on("watch", () => {
        const current = selector();
        if (shallowEqual(prev, current)) {
          prev = current;
          handler(current);
        }
      });
    },
    binding() {
      throw new Error("No binding installed");
    },
  });
}

const originalHooks = {};
const currentHooks = init();
Object.assign(originalHooks, currentHooks);

currentHooks.$.init = init;

export default currentHooks.$;
