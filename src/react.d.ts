import tenx, { Tenx, TenxHooks } from "./index";
import { Store } from "./store";

export default tenx;

export function useTenx<T = any>(
  options: UseTenxOptions<T>
): [Tenx, LocalStoreInfer<T>];

export interface UseTenxOptions<T> {
  override?(hooks: TenxHooks): void;
  store: T;
}

export type LocalStoreInfer<T> = T extends () => Store<infer U>
  ? Store<U>
  : Store<T>;
