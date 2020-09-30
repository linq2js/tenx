import globalContext from "./globalContext";

export default function wrapUpdate(callback, onBegin, onEnd) {
  onBegin && onBegin();
  const prevUpdates = globalContext.updates;
  const updates = (globalContext.updates = new Set());
  try {
    return callback();
  } finally {
    globalContext.updates = prevUpdates;
    if (globalContext.updates) {
      updates.forEach((update) => globalContext.updates.add(update));
    } else {
      updates.forEach((update) => update());
    }
    onEnd && onEnd();
  }
}
