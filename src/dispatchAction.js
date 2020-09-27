import isPromiseLike from "./isPromiseLike";
import globalContext from "./globalContext";
import isIteratorLike from "./isIteratorLike";
import Yield from "./Yield";
import processIterator from "./processIterator";

export default function dispatchAction(
  store,
  context,
  actionName,
  actionBody,
  payload
) {
  if (globalContext.generator) {
    return new Yield("call", actionBody, [store, payload]);
  }
  let changedToken = context.changedToken;
  try {
    globalContext.dispatchScopes++;
    const result = actionBody(store, payload);
    if (isPromiseLike(result)) {
      changedToken = context.changedToken;
      return result
        .catch((error) => {
          context.emitter.emit("error", { store, error });
          throw error;
        })
        .finally(() => {
          // there are some changes since last time
          if (changedToken !== context.changedToken) {
            // emit render event for updating UI
            context.emitter.emit("render", { store });
          }
        });
    }

    if (isIteratorLike(result)) {
      let handler;
      let promiseResolve;
      let isDone = false;
      let iteratorResult = undefined;
      const promise = new Promise((resolve) => (promiseResolve = resolve));
      context.iteratorContext.last = context.sagas[actionName];
      handler = processIterator(
        result,
        (result) => {
          promise.result = iteratorResult = result;
          promiseResolve(result);
          isDone = true;
        },
        context.iteratorContext
      );
      context.sagas[actionName] = handler;
      promise.cancel = handler.cancel;
      handler.start();
      promise.async = !isDone;
      return promise;
    }

    return result;
  } catch (error) {
    context.emitter.emit("error", { store, error });
  } finally {
    globalContext.dispatchScopes--;
    context.emitter.emit("dispatch", {
      store,
      action: { type: actionName, payload },
    });
    context.emitter.emit("watch", { store });
    if (
      changedToken !== context.changedToken &&
      !globalContext.dispatchScopes
    ) {
      // emit render event for updating UI
      context.emitter.emit("render", { store });
    }
  }
}
