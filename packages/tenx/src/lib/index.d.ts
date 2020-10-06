export default function tenx<TStateDefinition = {}, TActionDefinition = {}>(
  state?: TStateDefinition,
  actions?: TActionDefinition
): Store<TStateDefinition, TActionDefinition>;

export type Store<TStateDefinition, TActionDefinition = {}> = {
  state: AccessibleStateProps<TStateDefinition>;
} & StoreBase &
  AccessibleStateProps<TStateDefinition> &
  GenericDispatcher &
  ActionStoreProps<Omit<TActionDefinition, "init">>;

export type AccessibleStateProps<TStateDefinition> = ComputedStatesInfer<
  TStateDefinition
> &
  MutableStatesInfer<TStateDefinition>;

export type ComputedStatesInfer<TStateDefinition> = TStateDefinition extends {
  computed: infer TComputed;
}
  ? ComputedStoreProps<TComputed>
  : {};

export type MutableStatesInfer<TStateDefinition> = MutableStoreProps<
  Omit<TStateDefinition, "computed">
>;

export type MutableStoreProps<TState> = {
  [key in keyof TState]: TState[key] extends MutableState<infer T>
    ? T
    : TState[key];
};

export type ComputedStoreProps<TState> = {
  [key in keyof TState]: any;
};

export interface GenericDispatcher {
  dispatch<TPayload, TReturn>(
    action: Action<TPayload, TReturn>,
    payload?: TPayload
  ): DispatchResult<TReturn>;
}

export type DispatchResult<TReturn> = TReturn extends Generator<any, infer T>
  ? Task<T>
  : TReturn;

export type Dispatcher<TPayload = never, TReturn = void> = (
  payload?: TPayload
) => DispatchResult<TReturn>;

export type ActionStoreProps<TActions> = {
  [key in keyof TActions]: TActions[key] extends Action<
    infer TPayload,
    infer TReturn
  >
    ? Dispatcher<TPayload, TReturn>
    : never;
};

export type Action<TPayload = never, TReturn = void> = (
  context?: StoreContextBase,
  payload?: TPayload
) => TReturn;

export interface StoreContextBase extends GenericDispatcher {
  get<T = any>(name: string): MutableState<T>;
}

export type StoreContext<
  TExtra = {},
  TStateDefinition = {}
> = StoreContextBase &
  TExtra &
  StateAccessor<MutableStatesInfer<TStateDefinition>> &
  GenericStateMap<MutableStatesInfer<TStateDefinition>>;

export interface GenericStateMap<TMutableState> {
  [key: string]: MutableState<any>;
}

export interface StateAccessor<TState> {
  state: { value: TState };
}

export interface MutableState<T> extends Loadable<T> {
  value: T;
  readonly loadable: Loadable<T>;
}

export interface ReadonlyState<T> extends Loadable<T> {
  readonly value: T;
  readonly loadable: Loadable<T>;
}

export interface ComputedState<T> {
  readonly value: T;
}

export interface Loadable<T> {
  readonly value: T;
  readonly error: any;
  readonly status: "loading" | "hasError" | "hasValue";
  readonly promise: Promise<any>;
}

export type KeyOf<T> = keyof T;

export interface StoreBase extends GenericDispatcher {
  readonly state: any;
  readonly loading: boolean;
  readonly error: boolean;
  when: When;
  get<T = any>(name: string): ReadonlyState<T>;
  watch: Watch;
}

export interface ActionInfo {
  readonly type: Function;
  readonly payload: any;
}

export interface ChangeArgs {
  readonly store: StoreBase;
}

export interface UpdateArgs {
  readonly store: StoreBase;
}

export interface Task<T = any> extends Promise<T>, Cancellable {
  readonly async: boolean;
  readonly result: T;
}

export interface Cancellable {
  cancel(): void;
}

export interface DispatchArgs {
  readonly action: ActionInfo;
  readonly store: StoreBase;
}

export interface When {
  (action: "*" | Function | Function[]): Promise<ActionInfo> & Cancellable;
  (action: "change"): Promise<ChangeArgs> & Cancellable;
  (action: "update"): Promise<UpdateArgs> & Cancellable;
  (action: "dispatch"): Promise<DispatchArgs> & Cancellable;

  (
    action: "*" | Function | Function[],
    listener: Listener<DispatchArgs>
  ): RemoveListener;
  (action: "change", listener: Listener<ChangeArgs>): RemoveListener;
  (action: "update", listener: Listener<UpdateArgs>): RemoveListener;
  (action: "dispatch", listener: Listener<DispatchArgs>): RemoveListener;
}

export interface Watch {
  <TValue = any>(
    prop: string,
    callback: Listener<WatchArgs<TValue>>
  ): RemoveListener;
  <TValue, TKey = keyof TValue>(
    props: TKey[],
    callback: Listener<WatchArgs<TValue>>
  ): RemoveListener;
}

export type Listener<T> = (args: T) => any;

export type RemoveListener = () => void;

export interface WatchArgs<TValue> {
  readonly store: StoreBase;
  readonly current: TValue;
  readonly previous: TValue;
}

export type WatchValue<
  TState,
  TKey extends KeyOf<AccessibleStateProps<TState>>
> = AccessibleStateProps<TState>[TKey];
