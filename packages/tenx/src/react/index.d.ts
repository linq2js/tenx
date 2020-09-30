import {
  AccessibleStateValues,
  ActionContext,
  Dispatcher,
  Loadable,
  StateBag,
  Store,
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

export function componentStore<TState>(
  state: TState
): UseComponentStore<TState>;

export type UseComponentStore<TState> = (
  key?: any
) => ActionContext<StateBag, TState> & { callback: CallbackFactory };

export interface UseStoreContext<TState> {
  dispatch: Dispatcher;
  callback: CallbackFactory;
}

export type DisplayableStateValues<TState> = AccessibleStateValues<TState> & {
  get<T = any>(name: string): Loadable<T>;
};

export type CallbackFactory = <TResult>(
  fn: () => TResult,
  ...keys: any[]
) => TResult;
