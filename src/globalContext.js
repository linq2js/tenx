const defaultValue = {
  generator: undefined,
  render: undefined,
  computed: undefined,
  dispatchScopes: 0,
};
const globalContext = {
  ...defaultValue,
};

export default globalContext;

export function reset() {
  Object.assign(globalContext, defaultValue);
}
