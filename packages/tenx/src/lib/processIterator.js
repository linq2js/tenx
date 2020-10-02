import globalContext from "./globalContext";
import isPromiseLike from "./isPromiseLike";
import wrapUpdate from "./wrapUpdate";
import Yield from "./Yield";
import isIteratorLike from "./isIteratorLike";

export default function processIterator(iterator, callback, context) {
  const props = {
    cancelled: false,
    started: false,
    onCancel: [],
  };
  const generatorContext = { next, last: context.last };

  function next(payload) {
    if (props.cancelled) return;

    const { done, value } = wrapUpdate(
      () => iterator.next(payload),
      () => (globalContext.generator = generatorContext),
      () => (globalContext.generator = undefined)
    );
    if (done) {
      if (callback) return callback(value);
      return;
    }

    processYield(value, next);
  }

  function processYield(value, callback) {
    if (value instanceof Yield) {
      // support store action
      // yield store.action(payload)
      if (value.type === "call") {
        return call(value.target, value.args, callback);
      }

      // support store event
      // yield store.when('increase')
      if (value.type === "wait") {
        return wait(value.target, callback);
      }

      if (value.type === "fork") {
        const result = value.target(...value.args);
        if (result && result.cancel) {
          props.onCancel.push(result.cancel);
        }
        return callback();
      }

      return invalidYieldType();
    }

    // support promise
    // yield apiCall(payload)
    if (isPromiseLike(value)) {
      return wait(value, callback);
    }

    if (Array.isArray(value)) {
      // async all
      return async("all", value, callback);
    }

    if (typeof value === "object") {
      // async race
      return async("race", value, callback);
    }

    invalidYieldType();
  }

  function async(type, target, callback) {
    const entries = Object.entries(target);
    const results = type === "race" ? {} : [];
    const cancels = [];
    let doneCount = 0;
    let isDone = false;

    entries.forEach(([key, value]) => {
      const result = processYield(value, (result) => {
        if (isDone) return;
        doneCount++;
        results[key] = result;
        if (type === "all" && doneCount < entries.length) {
          return;
        }

        isDone = true;
        if (type === "race") {
          cancels.forEach((x) => x());
        }
        callback(results);
      });

      if (result && result.cancel) {
        cancels.push(result.cancel);
      }
    });
  }

  function wait(target, callback) {
    if (typeof target === "function") {
      const unsubscribe = target((args) => {
        unsubscribe && unsubscribe();
        !props.cancelled && callback(args && args.action);
      });
      unsubscribe && props.onCancel.push(unsubscribe);
      return {
        cancel: unsubscribe,
      };
    }
    if (isPromiseLike(target)) {
      target.cancel && props.onCancel.push(target.cancel);
      return Object.assign(
        target.then(
          (resolved) => !props.cancelled && callback(resolved),
          (error) => !props.cancelled && iterator.throw(error)
        ),
        {
          cancel: target.cancel,
        }
      );
    }
    throw new Error("Invalid wait target");
  }

  function call(target, args, callback) {
    const result = target(...args);
    if (isPromiseLike(result)) {
      return wait(result, callback);
    }
    if (isIteratorLike(result)) {
      const childIterator = processIterator(result, callback, context);
      props.onCancel.push(childIterator.cancel);
      childIterator.start();
      return childIterator;
    }
    callback(result);
  }

  function cancel() {
    if (props.cancelled) return;
    props.cancelled = true;
    props.onCancel.forEach((x) => x());
  }

  function start(payload) {
    if (props.started) return;
    props.started = true;
    next(payload);
  }

  return {
    cancel,
    start,
  };
}

function invalidYieldType() {
  throw new Error("Invalid yield type");
}
