const defaultSelector = (x) => x;
const emptyArray = [];

export default function arrayState(
  initial = emptyArray,
  { shallowCompare = true } = {}
) {
  return function (state) {
    state.value = initial;

    function mutate(mutation) {
      let clonedArray;

      function clone(from, to) {
        return clonedArray || (clonedArray = state.value.slice(from, to));
      }

      const res = mutation(state.value, clone);
      if (!res) return;
      const [result, changed] = res;
      const next =
        changed === true ? result : clonedArray || changed || state.value;
      if (
        shallowCompare &&
        next !== state.value &&
        next.length === state.value.length
      ) {
        // nothing to change
        if (next.every((item, index) => item === state.value[index]))
          return result;
      }
      state.value = next;

      return result;
    }

    return Object.assign(state, {
      slice(from, to) {
        return mutate((original, clone) =>
          original.length ? [clone(from, to)] : [original]
        );
      },
      push() {
        return mutate((original) => [original.concat(...arguments), true]);
      },
      pop() {
        return mutate((original, clone) =>
          original.length ? [clone().pop()] : [undefined, original]
        );
      },
      splice(index = 0, length = 1, ...items) {
        if (typeof length === "function") {
          let i;
          for (i = index; i < state.value.length; i++) {
            if (!length(state.value[i], i)) {
              break;
            }
          }
          length = i - index;
        }

        return mutate((original, clone) => {
          // nothing to insert or remove
          if (!items.length && !length) return [emptyArray];
          if (!original.length && !items.length) return [emptyArray];
          return [clone().splice(index, length, ...items)];
        });
      },
      sort(fn) {
        return mutate((original, clone) =>
          original.length ? [clone().sort(fn), true] : [original]
        );
      },
      orderBy() {
        const [fn = defaultSelector, order = 1] =
          arguments.length < 2 && typeof arguments[0] !== "function"
            ? [undefined, arguments[0]]
            : arguments;

        return this.sort((a, b) => {
          const av = fn(a);
          const bv = fn(b);
          return (av > bv ? 1 : av < bv ? -1 : 0) * order;
        });
      },
      shift() {
        return (original, clone) =>
          original.length ? [clone().shift()] : [undefined];
      },
      unshift() {
        return mutate((original) =>
          arguments.length
            ? [Array.from(arguments).concat(original), true]
            : [original]
        );
      },
      map(mapper) {
        return mutate((original) =>
          original.length ? [original.map(mapper), true] : [original]
        );
      },
      filter(predicate) {
        return mutate((original) =>
          original.length ? [original.filter(predicate), true] : [original]
        );
      },
      swap(a, b) {
        return mutate((original, clone) => {
          if (original[a] === original[b]) return [original];
          const c = clone();
          c[a] = c[b];
          return [c];
        });
      },
    });
  };
}
