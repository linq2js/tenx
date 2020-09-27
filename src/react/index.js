import createSharedStoreHook from "./createSharedStoreHook";
import createComponentStore from "./createComponentStore";
export { default as useStore } from "./useStore";

export default {
  shared: createSharedStoreHook,
  component: createComponentStore,
};
