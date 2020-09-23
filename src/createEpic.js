import createTask from "./createTask";

export default function createEpic(fn, parent) {
  let current;
  return function () {
    current = createTask(current, parent);
    return fn(current, ...arguments);
  };
}
