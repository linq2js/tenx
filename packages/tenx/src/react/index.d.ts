import {
  AccessibleStateValues,
  StoreContext,
  Dispatcher,
  Loadable,
  StateBag,
  Store,
  StoreActions,
} from "../lib";

export function useStore<TState>(
  store: Store<TState>
): AccessibleStateValues<TState>;
export function useStore<TState, TResult = any>(
  store: Store<TState>,
  selector: (
    state?: DisplayableStateValues<TState>,
    context?: UseStoreContext<TState>
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

export interface UseStoreContext<TState> {
  dispatch: Dispatcher;
  callback: CallbackFactory;
}

export type DisplayableStateValues<TState> = AccessibleStateValues<TState> & {
  get<T = any>(name: string): Loadable<T>;
};

export type CallbackFactory = <TFunc extends Function>(
  fn: TFunc,
  ...keys: any[]
) => TFunc;
