import globalContext from "../globalContext";
import Yield from "../Yield";

export default function delay(ms = 0, value) {
  let timerId;
  const promise = new Promise(
    (resolve) => (timerId = setTimeout(resolve, ms, value))
  );
  promise.cancel = () => clearTimeout(timerId);
  if (globalContext.generator) {
    return new Yield("wait", promise);
  }
  return promise;
}
