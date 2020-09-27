import { ModelInfer, Store } from "../index";

declare const hookFactory: HookFactory;

export default hookFactory;

export interface HookFactory {
  shared<TModel>(store: Store<TModel>): SharedStoreHook<TModel>;
  shared<TModel>(model: ModelInfer<TModel>): SharedStoreHook<TModel>;
  component<TModel>(
    model: ModelInfer<TModel>,
    options?: ComponentStoreHookOptions
  ): ComponentStoreHook<TModel>;
}

export interface ComponentStoreHookOptions {
  key?: string;
  cache?: {};
}

export interface SharedStoreHook<TModel> extends Function {
  <TResult>(selector: (store: Store<TModel>) => TResult): TResult;
}

export interface ComponentStoreHook<TModel> extends Function {
  (): Store<TModel> & ComponentStore;
}

export interface ComponentStore {
  stateReady(): boolean;
}
