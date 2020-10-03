import createArrayKeyedMap from "../lib/createArrayKeyedMap";

export default function callbackFactory() {
  const cache = createArrayKeyedMap();

  return Object.assign(
    function (func, ...keys) {
      cache.hookIndex++;
      return cache.getOrAdd([cache.hookIndex].concat(keys), () => func);
    },
    {
      resetHookIndex() {
        cache.hookIndex = 0;
      },
    }
  );
}
