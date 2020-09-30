import isEqual from "../lib/isEqual";

export default function (oldValue, newValue) {
  if (typeof newValue === "function") newValue = newValue();
  if (isEqual(oldValue, newValue)) return oldValue;
  if (
    Array.isArray(oldValue) &&
    Array.isArray(newValue) &&
    oldValue.length === newValue.length &&
    oldValue.every((value, index) => newValue[index] === value)
  )
    return oldValue;
  return newValue;
}
