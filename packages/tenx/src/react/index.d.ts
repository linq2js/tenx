import {
  StoreContext,
  Loadable,
  Store,
  MutableStatesInfer,
  AccessibleStateProps,
  GenericDispatcher,
  ActionStoreProps,
} from "../lib";

export function useStore<TState, TAction>(
  store: Store<TState, TAction>
): MutableStatesInfer<TState>;

export function useStore<TState, TAction, TResult = any>(
  store: Store<TState, TAction>,
  selector: (
    state?: DisplayableStateValues<TState>,
    context?: UseStoreContext<TAction>
  ) => TResult
): TResult;

export function componentStore<TState, TActions>(
  state: TState,
  actions?: TActions
): UseComponentStore<TState, TActions>;

export type UseComponentStore<TState, TAction> = (
  key?: any
) => StoreContext<{}, TState> & {
  callback: CallbackFactory;
} & ActionStoreProps<TAction>;

export type UseStoreContext<TActions> = GenericDispatcher & {
  callback: CallbackFactory;
} & ActionStoreProps<TActions>;

export type DisplayableStateValues<TState> = AccessibleStateProps<TState> & {
  get<T = any>(name: string): Loadable<T>;
};

export type CallbackFactory = <TFunc extends Function>(
  fn: TFunc,
  ...keys: any[]
) => TFunc;
