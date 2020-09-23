import wrapPromise from "./wrapPromise";
import createEmitter from "./createEmitter";
import createEpic from "./createEpic";
import isPromiseLike from "./isPromiseLike";

export default function createTask(last, parent) {
  const emitter = createEmitter();
  const props = {
    cancelled: false,
    disposed: false
  };

  let removeParentOnCancel = parent && parent.onCancel(cancel);

  function cancelled() {
    return props.cancelled;
  }

  function delay(ms) {
    let timerId;
    const promise = wrapPromise(
      new Promise((resolve) => {
        timerId = setTimeout(resolve, ms);
      })
    );
    emitter.on("dispose", () => clearTimeout(timerId));
    emitter.on("cancel", promise.cancel);
    return promise;
  }

  function debounce(ms) {
    latest();
    return delay(ms);
  }

  function latest() {
    last && typeof last.cancel === "function" && last.cancel();
  }

  function cancel() {
    if (props.cancelled) return;
    props.cancelled = true;
    emitter.emit("cancel");
    dispose();
  }

  function dispose() {
    if (props.disposed) return;
    props.disposed = true;
    removeParentOnCancel && removeParentOnCancel();
    emitter.emit("dispose");
  }

  function wrap(target) {
    if (typeof target === "function") {
      return createEpic(target, task);
    }

    if (isPromiseLike(target)) {
      return wrapPromise(target, task);
    }
  }

  function call(fn, ...args) {
    if (props.cancelled) return;
    const result = fn(...args);
    if (isPromiseLike(result)) return wrapPromise(result, task);
    return result;
  }

  const task = {
    delay,
    debounce,
    latest,
    cancelled,
    cancel,
    dispose,
    wrap,
    call,
    onCancel: emitter.get("cancel").on
  };

  return task;
}
