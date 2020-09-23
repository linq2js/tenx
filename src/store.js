import shallowEqual from "./shallowEqual";

export default ({ initial = {}, maxSnapshot } = {}) => {
  const snapshot = {
    list: [],
    create(props) {
      let stateProps = getStateProps();
      if (props) {
        const tempProps = {};
        (Array.isArray(props) ? props : [props]).forEach((prop) => {
          tempProps[prop] = stateProps[prop];
        });
        stateProps = tempProps;
      }
      // nothing change
      const current = snapshot.list[snapshot.list.length - 1];
      if (shallowEqual(current, stateProps)) {
        return current;
      }
      snapshot.list = snapshot.list.concat(stateProps);
      if (maxSnapshot && snapshot.list.length > maxSnapshot) {
        snapshot.list.shift();
      }
      return stateProps;
    },
    clear() {
      snapshot.list = [];
    },
    remove(index) {
      if (
        typeof index === "undefined" ||
        index < 0 ||
        index >= snapshot.list.length
      )
        throw new Error("Invalid snapshot index");
      snapshot.list = snapshot.list.slice();
      snapshot.list.splice(index, 1);
    },
    revert(index) {
      if (
        typeof index === "undefined" ||
        index < 0 ||
        index >= snapshot.list.length
      )
        throw new Error("Invalid snapshot index");
      reset(snapshot.list[index]);
    }
  };

  function getStateProps() {
    const { snapshot, reset, ...stateProps } = state;
    return stateProps;
  }

  function reset(data = initial) {
    const stateProps = getStateProps();
    Object.entries(stateProps).forEach(([key, value]) => {
      delete state[key];
      if (value && typeof value.reset === "function") {
        value.reset();
      }
    });
    Object.assign(state, data);
  }
  const state = {
    ...initial,
    snapshot,
    reset
  };

  return state;
};
