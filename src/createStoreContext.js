import createArrayKeyedMap from "./createArrayKeyedMap";
import createEmitter from "./createEmitter";
import globalContext from "./globalContext";

export default function createStoreContext(store) {
  let context;
  let asyncStateChangedTimer;

  function onStateChanged() {
    context.changedToken = {};
    context.stateObject = undefined;

    if (!globalContext.dispatchScopes) {
      context.emitter.emit("change", { store });
    }
  }

  function onAsyncStateChanged() {
    clearTimeout(asyncStateChangedTimer);
    asyncStateChangedTimer = setTimeout(onStateChanged, 0);
  }

  const cache = createArrayKeyedMap();
  cache.hookIndex = 0;

  return (context = {
    loading: false,
    error: undefined,
    cache,
    staticStates: {},
    stateEntries: {},
    stateMap: createArrayKeyedMap(),
    childStores: {},
    actions: {},
    defaultSelectors: {},
    uiSelectors: {},
    stateObject: undefined,
    emitter: createEmitter(),
    changedToken: {},
    sagas: {},
    onStateChanged,
    onAsyncStateChanged,
    iteratorContext: {
      get changedToken() {
        return context.changedToken;
      },
      onStateChanged,
      onAsyncStateChanged,
    },
  });
}
