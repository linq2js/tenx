import globalContext from "./globalContext";
import Yield from "./Yield";
import isEqual from "./isEqual";

export default function addStoreWatcher(store, context, selector, callback) {
  if (globalContext.generator) {
    return new Yield("wait", (callback) => {
      return addStoreWatcher(store, context, selector, callback);
    });
  }

  if (typeof callback === "undefined") {
    let unsubscribe;
    return Object.assign(
      new Promise((resolve) => {
        unsubscribe = addStoreWatcher(store, context, selector, (args) => {
          unsubscribe();
          resolve(args);
        });
      }),
      {
        cancel() {
          unsubscribe && unsubscribe();
        }
      }
    );
  }

  if (typeof selector === "string") {
    const prop = selector;
    selector = (store) => store[prop];
  } else if (Array.isArray(selector)) {
    const props = selector;
    selector = (store) => {
      const result = {};
      props.forEach((prop) => (result[prop] = store[prop]));
      return result;
    };
  }

  let previous = selector(store);
  return context.emitter.on("watch", () => {
    const current = selector(store);
    if (isEqual(current, previous)) return;
    callback({ store, current, previous });
  });
}
