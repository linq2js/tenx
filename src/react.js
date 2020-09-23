import { useRef, useEffect, useState } from "react";
import isPromiseLike from "./isPromiseLike";
import shallowEqual from "./shallowEqual";
import tenx from "./index";
import createStore from "./store";

function initBinding(hooks, defaultPayload) {
  hooks.binding = function Binding(selector, payload = defaultPayload) {
    const data = useRef({}).current;
    data.rerender = useState()[1];
    data.select = selector;
    if (!data.handleChange) {
      data.handledPromises = new WeakSet();
      data.handleChange = () => {
        data.error = undefined;
        try {
          const next = data.select(payload);
          if (shallowEqual(next, data.prev)) return;
        } catch (e) {
          if (isPromiseLike(e)) {
            if (!data.handledPromises.has(e)) {
              data.handledPromises.add(e);
              e.finally(data.handleChange);
            }
          }
          data.error = e;
        }
        data.rerender({});
      };
    }
    useEffect(() => hooks.on({ type: "#render", handler: data.handleChange }), [
      data
    ]);

    return (data.prev = data.select(payload));
  };
}

export function useTenx(options) {
  const context = useRef({}).current;
  if (!context.hooks || context.options !== options) {
    context.options = options;
    const { override, store, autoBind = true } = options || {};
    const hooks = {
      store:
        typeof store === "function" ? store() : createStore({ initial: store })
    };
    tenx.init(hooks);
    initBinding(hooks, hooks.store);
    typeof override === "function" && override(hooks);

    if (autoBind) {
      context.bind = () => hooks.binding(() => ({ ...hooks.store }));
    } else {
      context.bind = () => {};
    }

    context.hooks = hooks;
  }
  context.bind();
  return [context.hooks.$, context.hooks.store];
}

initBinding(tenx());

export default tenx;
