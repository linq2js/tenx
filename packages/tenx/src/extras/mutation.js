export function mutateProp(obj, prop, value) {
  if (typeof value === "function") {
    value = value(obj[prop]);
  }
  if (obj[prop] === value) return obj;
  const copy = Array.isArray(obj) ? obj.slice() : { ...obj };
  copy[prop] = value;
  return copy;
}

export function setIn(obj = {}, props, value) {
  if (props.length === 1) {
    return mutateProp(obj, props[0], value);
  }
  const child = obj[props[0]];
  return setIn(obj, props[0], setIn(child, props.slice(1), value));
}
