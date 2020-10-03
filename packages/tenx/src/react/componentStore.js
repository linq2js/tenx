import { useEffect, useRef, useState } from "react";
import createArrayKeyedMap from "../lib/createArrayKeyedMap";
import createStore from "../lib/createStore";
import { noop } from "../lib/types";
import callbackFactory from "./callbackFactory";

export default function componentStore(model, actions) {
  const instances = createArrayKeyedMap();
  function storeFactory() {
    return createStore(model, {
      ...actions,
      component: true,
    });
  }

  return function useComponentStore(key) {
    const data = useRef({}).current;
    data.rerender = useState({})[1];
    if (!data.store) {
      data.store = arguments.length
        ? instances.getOrAdd(key, storeFactory)
        : storeFactory();
      data.callback = callbackFactory();
    }
    data.isRendering = true;
    data.callback.resetHookIndex();

    useEffect(() => {
      data.isRendering = false;
      if (data.shouldRerender) {
        data.shouldRerender = false;
        data.rerender({});
      }
    });

    useEffect(() => {
      return data.store.when("update", () => {
        if (data.isRendering) {
          data.shouldRerender = true;
          return;
        }
        data.rerender({});
      });
    }, [data]);

    useEffect(() => {
      return () => {
        data.rerender = noop;
      };
    }, [data]);

    data.store.callback = data.callback;

    return data.store;
  };
}
