import { useEffect, useRef, useState } from "react";
import createArrayKeyedMap from "../lib/createArrayKeyedMap";
import globalContext from "../lib/globalContext";
import isEqual from "../lib/isEqual";
import isPromiseLike from "../lib/isPromiseLike";
import callbackFactory from "./callbackFactory";

export default function useStore(store, selector) {
  const data = useRef({}).current;
  data.selector = selector;
  data.rerender = useState(undefined)[1];
  if (data.store !== store) {
    data.store = store;
    data.cache = createArrayKeyedMap();
    data.selectContext = {
      dispatch: data.store.dispatch,
      callback: callbackFactory(),
    };
    data.checkStoreReady = () => {
      if (data.store.loading) {
        if (data.store.error) throw data.store.error;
        throw data.store.__initPromise;
      }
    };
    data.select = function () {
      data.error = undefined;
      data.selectContext.callback.resetHookIndex();
      try {
        globalContext.render = true;
        data.checkStoreReady();
        return data.selector
          ? data.selector(data.store.__displayContext, data.selectContext)
          : data.store.state;
      } catch (error) {
        if (isPromiseLike(error)) {
          // re-render when promise done
          if (!data.cache.get(error)) {
            data.cache.set(error, true);
            error.finally(data.handleChange);
          }
        }
        data.error = error;
      } finally {
        globalContext.render = false;
      }
    };
    data.handleChange = function () {
      const next = data.select();
      if (!data.error && isEqual(next, data.prev)) return;
      data.rerender({});
    };
  }

  useEffect(() => {
    data.store.when("update", data.handleChange);
  }, [data, store]);
  // an error captured from handleChange()
  if (data.error) throw data.error;
  data.prev = data.select();
  // an error captured from select()
  if (data.error) throw data.error;
  return data.prev;
}
