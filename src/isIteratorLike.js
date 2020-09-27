export default function isIteratorLike(obj) {
  return obj && typeof obj.next === "function";
}
