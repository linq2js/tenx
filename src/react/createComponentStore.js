import { useEffect, useRef, useState } from "react";
import createStore from "../createStore";

export default function createComponentStore(model) {
  return function ComponentStoreHook() {
    const data = useRef({}).current;
    data.rerender = useState(undefined)[1];
    data.isRendering = true;
    data.handledPromises = new WeakSet();
    if (data.model !== model || !data.store) {
      data.model = model;
      data.handleAsyncState = (promise) => {
        if (!data.handledPromises.has(promise)) {
          data.handledPromises.add(promise);
          promise.finally(data.handleChange);
        }
        data.stateReady = false;
      };
      data.store = createStore(model, {
        local: true,
        handleAsyncState: data.handleAsyncState,
      });
      data.store.stateReady = () => {
        if (!data.isRendering) {
          throw new Error("Should call stateReady in rendering phase");
        }
        return data.stateReady;
      };
      data.handleChange = () => {
        if (data.isRendering) {
          data.shouldReRender = true;
        } else {
          data.rerender({});
        }
      };
    }
    useEffect(() => {
      return data.store.onChange( data.handleChange);
    }, [data.store]);
    useEffect(() => {
      data.isRendering = false;
      if (data.shouldReRender) {
        data.shouldReRender = false;
        data.rerender({});
      }
    });

    data.stateReady = true;
    data.store.__resetHookIndex();

    if (data.store.loading) {
      if (data.store.error) throw data.store.error;
      data.handleAsyncState(data.store.__loadingPromise);
    }

    return data.store;
  };
}
