import {
  AccessibleStateValues,
  StoreContext,
  Dispatcher,
  Loadable,
  StateBag,
  Store,
  StoreActions,
  StoreStateInfer,
  StoreActionsInfer,
} from "../lib";

export function useStore<TStore extends Store<any, any>>(
  store: TStore
): AccessibleStateValues<StoreStateInfer<TStore>>;
export function useStore<TStore extends Store<any, any>, TResult = any>(
  store: TStore,
  selector: (
    state?: DisplayableStateValues<StoreStateInfer<TStore>>,
    context?: UseStoreContext<
      StoreStateInfer<TStore>,
      StoreActionsInfer<TStore>
    >
  ) => TResult
): TResult;

export function componentStore<TState, TActions>(
  state: TState,
  actions?: TActions
): UseComponentStore<TState, TActions>;

export type UseComponentStore<TState, TActions> = (
  key?: any
) => StoreContext<StateBag, TState> & {
  callback: CallbackFactory;
} & StoreActions<TState, TActions>;

export type UseStoreContext<TState, TActions> = {
  dispatch: Dispatcher;
  callback: CallbackFactory;
} & StoreActions<TState, TActions>;

export type DisplayableStateValues<TState> = AccessibleStateValues<TState> & {
  get<T = any>(name: string): Loadable<T>;
};

export type CallbackFactory = <TFunc extends Function>(
  fn: TFunc,
  ...keys: any[]
) => TFunc;
