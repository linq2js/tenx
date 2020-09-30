import isPromiseLike from "../lib/isPromiseLike";

export default function cancellable(target) {
  if (!target) return target;
  if (typeof target.cancel === "function") return target;
  if (isPromiseLike(target)) {
    let cancelled = false;
    const promiseWrapper = Object.assign(
      new Promise((resolve, reject) => {
        target.then(
          (result) => {
            if (cancelled) return;
            promiseWrapper.result = result;
            resolve(result);
          },
          (error) => {
            if (cancelled) return;
            promiseWrapper.error = error;
            reject(error);
          }
        );
      }),
      {
        cancel() {
          cancelled = true;
        },
      }
    );
    return promiseWrapper;
  }
  if (typeof target === "function") {
    return function () {
      return cancellable(target(...arguments));
    };
  }
  throw new Error("Invalid target type: " + typeof target);
}
