import isPromiseLike from "./isPromiseLike";

export default function loadable(initial) {
  let data;

  function load(input) {
    if (isPromiseLike(input)) {
      data = {
        status: "loading",
        promise: input
      };

      const currentData = data;
      data.promise.then(
        (value) => {
          if (currentData !== data) return;
          data.status = "hasValue";
          data.value = value;
        },
        (error) => {
          if (currentData !== data) return;
          data.status = "hasError";
          data.error = error;
        }
      );
    } else {
      data = {
        status: "hasValue",
        value: input
      };
    }
  }

  load(initial);

  return {
    get data() {
      return data;
    },
    get status() {
      return data.status;
    },
    get error() {
      return data.error;
    },
    get promise() {
      return data.promise;
    },
    get value() {
      if (data.status === "loading") throw data.promise;
      if (data.status === "hasError") throw data.error;
      return data.value;
    },
    tryGetValue(defaultValue) {
      if (data.status !== "hasValue") return defaultValue;
      return data.value;
    }
  };
}
