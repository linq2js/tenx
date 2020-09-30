import globalContext from "../lib/globalContext";
import Yield from "../lib/Yield";

export default function delay(ms = 0, value) {
  let timerId;
  const promise = new Promise(
    (resolve) => (timerId = setTimeout(resolve, ms, value))
  );
  promise.cancel = () => clearTimeout(timerId);
  return promise;
}
