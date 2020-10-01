export default function delay(ms = 0, value) {
  let timerId;
  const onDispose = [];
  const promise = new Promise((resolve) => {
    timerId = setTimeout(() => {
      onDispose.forEach((x) => x());

      resolve(value);
    }, ms);
  });
  promise.cancel = () => clearTimeout(timerId);
  promise.cancel.onDispose = (x) => onDispose.push(x);
  return promise;
}
