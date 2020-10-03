import isEqual from "./isEqual";
import { noop } from "./types";

export default function createState(
  initial,
  onValueChange = noop,
  onStatusChange = onValueChange
) {
  const props = {
    value: initial,
    changeToken: undefined,
    loadableToken: undefined,
  };

  return {
    get value() {
      return props.value;
    },
    get loadable() {
      if (!props.loadable || props.loadableToken !== props.changeToken) {
        props.loadableToken = props.changeToken;
        const next = {
          value: props.value,
          error: props.error,
          status: props.promise
            ? "loading"
            : props.error
            ? "hasError"
            : "hasValue",
        };

        if (!isEqual(next, props.loadable)) {
          props.loadable = next;
        }
      }
      return props.loadable;
    },
    set value(value) {
      if (props.value === value) return;
      props.value = value;
      props.changeToken = {};
      onValueChange();
      if (props.promise || props.error) {
        delete props.promise;
        delete props.error;
        onStatusChange();
      }
    },
    get promise() {
      return props.promise;
    },
    get error() {
      return props.error;
    },
    get displayValue() {
      if (props.error) throw props.error;
      if (props.promise) throw props.promise;
      return props.value;
    },
    startUpdate(promise) {
      if (promise === props.promise) return;
      props.promise = promise;
      props.error = undefined;
      props.changeToken = {};
      onStatusChange();
    },
    endUpdate(promise, value, error) {
      if (props.promise !== promise) return false;
      props.changeToken = {};
      if (error) {
        props.error = error;
        onStatusChange();
      } else {
        if (typeof value === "function") {
          value(this);
        } else if (props.value !== value) {
          props.value = value;
          onValueChange();
        }
        onStatusChange();
      }
      return true;
    },
  };
}
