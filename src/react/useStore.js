import { useEffect, useRef, useState } from "react";
import createArrayKeyedMap from "../createArrayKeyedMap";
import globalContext from "../globalContext";
import isEqual from "../isEqual";

export default function useStore(store, selector) {
  const data = useRef({}).current;
  data.rerender = useState(undefined)[1];
  data.selector = selector;
  if (data.store !== store) {
    data.store = store;
    data.error = undefined;
    data.cache = createArrayKeyedMap();
    data.select = () => {
      if (data.store.loading) {
        if (data.store.error) throw data.store.error;
        if (data.handledLoadingPromise !== data.store.__loadingPromise) {
          data.handledLoadingPromise = data.store.__loadingPromise;
          data.handledLoadingPromise.then(data.handleChange);
        }
        throw data.store.__loadingPromise;
      }
      try {
        globalContext.render = {
          cache: data.cache,
        };
        data.cache.hookIndex = 0;
        return data.selector(data.store);
      } catch (error) {
        data.error = error;
      } finally {
        if (
          typeof data.prevHookIndex !== "undefined" &&
          data.prevHookIndex !== data.cache.hookIndex
        ) {
          data.error = new Error("Invalid hook usage");
        }
        data.prevHookIndex = data.cache.hookIndex;
        globalContext.render = undefined;
      }
    };
    data.handleChange = () => {
      data.error = undefined;
      const next = data.select();
      // noinspection PointlessBooleanExpressionJS
      if (!data.error && isEqual(next, data.current)) return;
      data.rerender({});
    };
  }

  useEffect(() => {
    return data.store.onChange(data.handleChange);
  }, [data.store]);

  data.current = data.select();

  if (data.error) throw data.error;

  return data.current;
}
