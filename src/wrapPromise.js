export default function wrapPromise(promise, parent) {
  const props = {
    cancelled: false,
    disposed: false
  };

  let removeParentOnCancel = parent && parent.onCancel(cancel);

  function cancel() {
    if (props.cancelled) return;
    promise.cancel && promise.cancel();
    props.cancelled = true;
    dispose();
  }

  function dispose() {
    if (props.disposed) return;
    promise.dispose && promise.dispose();
    props.disposed = true;
    removeParentOnCancel && removeParentOnCancel();
  }

  return Object.assign(
    new Promise((resolve, reject) => {
      promise.then(
        (value) => !props.cancelled && resolve(value),
        (error) => !props.cancelled && reject(error)
      );
    }),
    {
      cancel,
      dispose
    }
  );
}
