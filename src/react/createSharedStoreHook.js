import createStore from "../createStore";
import { storeType } from "../types";
import sharedHook from "./useStore";

export default function createSharedStoreHook(storeOrModel) {
  const store =
    storeOrModel.__type === storeType
      ? storeOrModel
      : createStore(storeOrModel);
  return function (selector) {
    return sharedHook(store, selector);
  };
}
