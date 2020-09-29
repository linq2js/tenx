import { mutateProp, setIn } from "./mutation";

export default function entityState(initial = {}) {
  return function (state) {
    state.value = initial;

    return Object.assign(state, {
      set(key, value) {
        const keys = Array.isArray(key) ? key : key.split(".");
        if (keys.length === 1) {
          return (state.value = mutateProp(state.value, keys[0], value));
        }

        return (state.value = setIn(state.value, keys, value));
      },
      unset() {
        let next = state.value;
        if (typeof arguments[0] === "function") {
          const fn = arguments[0];
          Object.entries(state.value).forEach((entry) => {
            if (fn(entry[0], entry[1])) {
              if (next === state.value) {
                next = { ...state.value };
              }
              delete next[entry[0]];
            }
          });
        } else {
          for (let i = 0; i < arguments.length; i++) {
            const key = arguments[i];
            if (key in next) {
              if (next === state.value) {
                next = { ...state.value };
              }
              delete next[key];
            }
          }
        }
        return (state.value = next);
      },
      merge(...values) {
        let next = state.value;
        values.forEach((value) => {
          Object.entries(value).forEach(([key, value]) => {
            if (next[key] !== value) {
              if (next === state.value) {
                next = { ...state.value };
              }
              next[key] = value;
            }
          });
        });
        return state.value;
      },
      swap(a, b) {
        let next = state.value;
        if (next[a] !== next[b]) {
          next = { ...state.value };
        }
        return (state.value = next);
      },
    });
  };
}
