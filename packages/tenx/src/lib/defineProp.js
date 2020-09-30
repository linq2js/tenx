export default function defineProp(obj, name, getter, setter) {
  Object.defineProperty(obj, name, {
    get() {
      return getter();
    },
    set: setter,
    enumerable: false,
  });
}
