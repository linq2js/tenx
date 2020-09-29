import { useEffect, useRef, useState } from "react";
import createArrayKeyedMap from "../createArrayKeyedMap";
import createStore from "../createStore";
import callbackFactory from "./callbackFactory";

export default function componentStore(model, options) {
  const instances = createArrayKeyedMap();
  function storeFactory() {
    return createStore(model, {
      ...options,
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

    data.store.callback = data.callback;

    return data.store;
  };
}
