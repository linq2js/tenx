import isPromiseLike from "./isPromiseLike";
import globalContext from "./globalContext";

export default function createState(
  initial,
  onChange,
  onAsyncChange,
  handleAsync
) {
  const props = {
    value: undefined,
    status: "hasValue",
    error: undefined,
    loadable: undefined,
    promise: undefined,
  };

  function mutate(nextValue, reducer, async) {
    if (typeof nextValue === "function") {
      nextValue = nextValue(props.value);
    }

    if (isPromiseLike(nextValue)) {
      if (nextValue === props.promise) return;
      props.promise = nextValue;
      props.status = "loading";
      props.loadable = undefined;
      props.error = undefined;
      onChange();
      return nextValue.then(
        (value) => {
          if (props.promise !== nextValue) {
            return;
          }
          if (typeof reducer === "function") {
            value = reducer(value, props.value);
          }
          mutate(value, reducer, true);
        },
        (error) => {
          if (props.promise !== nextValue) {
            return;
          }
          // TODO: need to consider to assign current value to undefined if there is an error
          // props.value = undefined;
          props.status = "hasError";
          props.error = error;
          props.loadable = undefined;
          onAsyncChange();
        }
      );
    }
    if (nextValue === props.value) return;
    props.status = "hasValue";
    props.loadable = undefined;
    props.value = nextValue;
    props.error = undefined;
    props.promise = undefined;

    if (async) {
      onAsyncChange();
    } else {
      onChange();
    }
  }

  mutate(initial);

  return {
    get value() {
      if (props.status === "loading") {
        if (handleAsync) {
          handleAsync(props.promise);
        } else if (globalContext.render) {
          throw props.promise;
        }
      }
      if (props.status === "hasError") throw props.error;

      return props.value;
    },
    set value(value) {
      mutate(value);
    },
    get error() {
      return props.error;
    },
    get status() {
      return props.status;
    },
    get loadable() {
      if (!props.loadable) {
        props.loadable = {
          status: props.status,
          value: props.value,
          error: props.error,
        };
      }
      return props.loadable;
    },
    reset() {
      mutate(initial);
    },
    mutate,
    cancel() {
      if (props.status !== "loading") return;
      delete props.promise;
      props.status = "hasValue";
    },
  };
}
