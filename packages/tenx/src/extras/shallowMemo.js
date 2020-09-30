import isEqual from "../lib/isEqual";

export default function (oldValue, newValue) {
  if (typeof newValue === "function") newValue = newValue();
  if (isEqual(oldValue, newValue)) return oldValue;
  return newValue;
}
