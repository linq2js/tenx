import createArrayKeyedMap from "../createArrayKeyedMap";

export default function callbackFactory() {
  const cache = createArrayKeyedMap();

  return function (func, ...keys) {
    cache.hookIndex++;
    return cache.getOrAdd([cache.hookIndex].concat(keys), () => func);
  };
}
