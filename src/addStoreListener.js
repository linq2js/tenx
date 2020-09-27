import globalContext from "./globalContext";
import Yield from "./Yield";
import createMatcher from "./createMatcher";

export default function addStoreListener(store, context, event, listener) {
  if (globalContext.generator) {
    return new Yield("wait", (callback) => {
      if (typeof listener === "undefined") {
        return addStoreListener(store, context, event, callback);
      }
      const unsubscribe = addStoreListener(store, context, event, listener);
      callback(unsubscribe);
      return unsubscribe;
    });
  }

  if (typeof listener === "undefined") {
    let unsubscribe;
    return Object.assign(
      new Promise((resolve) => {
        unsubscribe = addStoreListener(store, context, event, (args) => {
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

  if (event === "*") {
    return context.emitter.on("dispatch", listener);
  }

  if (event.charAt(0) === "#") {
    return context.emitter.on(event.substr(1), listener);
  }

  const matcher = createMatcher(event);
  return context.emitter.on("dispatch", (args) => {
    if (matcher(args.action.type)) {
      listener(args);
    }
  });
}
