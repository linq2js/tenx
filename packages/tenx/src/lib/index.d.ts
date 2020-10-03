export default function tenx<
  TState = {},
  TActions extends StoreOptions<TState> = any
>(
  state?: TState,
  actions?: TActions
): Store<TState> & StoreActions<TState, Omit<TActions, "init" | "component">>;

export interface State<T> extends Loadable<T> {
  value: T;
  readonly loadable: Loadable<T>;
}

export type StoreActions<TState, TActions> = {
  [key in keyof TActions]: TActions[key] extends (
    context: StoreContext<StateBag, TState>,
    payload: infer TPayload
  ) => infer TResult
    ? (payload?: TPayload) => TResult
    : TActions[key] extends (
        context?: StoreContext<StateBag, TState>
      ) => infer TResult
    ? () => TResult
    : (payload?: any) => void;
};

export interface StoreContextApi<TState> {
  dispatch: Dispatcher;
  when: When<TState>;
  latest(): void;
  delay(ms?: number): Promise<void>;
  debounce(ms?: number): Promise<void>;
  fork: Dispatcher;
  mutate: Mutate;
  get: Get;
  state: { value: TState };
}

export interface Loadable<T> {
  readonly value: T;
  readonly error: any;
  readonly status: "loading" | "hasError" | "hasValue";
  readonly promise: Promise<any>;
}

export type StoreContext<TStateBag = StateBag, TState = {}> = StoreContextApi<
  TState
> &
  TStateBag;

export interface StateBag {
  [key: string]: State<any>;
}

export type StoreOptions<TState> = {
  init?(context: StoreContext<{}, TState>): any;
} & {
  [key: string]: (context?: StoreContext<any, TState>, payload?: any) => any;
};

export type Store<TState> = StoreBase<TState> & AccessibleStateValues<TState>;

export type AccessibleStateValues<TState> = StaticStateValues<
  Omit<TState, "computed">
> &
  ComputedStateValues<TState>;

export interface StoreBase<TState> {
  readonly state: AccessibleStateValues<TState>;
  readonly loading: boolean;
  readonly error: boolean;
  dispatch: Dispatcher;
  when: When<TState>;
  get: Get;
  watch: Watch<TState>;
}

export type Get = <T = any>(name: string) => State<T>;

export interface Mutate {}

export interface Dispatcher extends Function {
  <TAction>(action: TAction, payload?: ActionPayload<TAction>): ActionReturn<
    TAction
  >;

  /**
   * get dispatcher for specified action
   * @param action
   */
  get<TAction>(
    action: TAction
  ): (payload?: ActionPayload<TAction>) => ActionReturn<TAction>;
}

export type RemoveListener = () => void;

export interface When<TState> {
  (action: "*" | Function | Function[]): Promise<ActionInfo> & Cancellable;
  (action: "change"): Promise<ChangeArgs<TState>> & Cancellable;
  (action: "update"): Promise<UpdateArgs<TState>> & Cancellable;
  (action: "dispatch"): Promise<DispatchArgs<TState>> & Cancellable;

  (
    action: "*" | Function | Function[],
    listener: Listener<DispatchArgs<TState>>
  ): RemoveListener;
  (action: "change", listener: Listener<ChangeArgs<TState>>): RemoveListener;
  (action: "update", listener: Listener<UpdateArgs<TState>>): RemoveListener;
  (
    action: "dispatch",
    listener: Listener<DispatchArgs<TState>>
  ): RemoveListener;
}

export type KeyOf<T> = keyof T;

export interface Watch<TState> {
  <TKey extends KeyOf<AccessibleStateValues<TState>>>(
    prop: TKey,
    callback: Listener<WatchArgs<TState, WatchValue<TState, TKey>>>
  ): RemoveListener;

  <TValue = { [key in keyof TState]: TState[key] }, TKey = keyof TState>(
    props: TKey[],
    callback: Listener<WatchArgs<TState, TValue>>
  ): RemoveListener;
}

export type WatchValue<
  TState,
  TKey extends KeyOf<AccessibleStateValues<TState>>
> = AccessibleStateValues<TState>[TKey];

export type Listener<T> = (args: T) => any;

export interface ActionInfo {
  readonly type: Function;
  readonly payload: any;
}

export interface ChangeArgs<TState> {
  readonly store: Store<TState>;
}

export interface WatchArgs<TState, TValue> {
  readonly store: Store<TState>;
  readonly current: TValue;
  readonly previous: TValue;
}

export interface UpdateArgs<TState> {
  readonly store: Store<TState>;
}

export interface DispatchArgs<TState> {
  readonly action: ActionInfo;
  readonly store: Store<TState>;
}

export type ActionPayload<TAction> = TAction extends (
  context?: any,
  payload?: infer TPayload
) => any
  ? TPayload
  : never;

export interface Task<T = any> extends Promise<T>, Cancellable {
  readonly async: boolean;
  readonly result: T;
}

export interface Cancellable {
  cancel(): void;
}

export type ActionReturn<TAction> = TAction extends (
  ...args: any[]
) => infer TReturn
  ? TReturn extends Generator<any, infer TResult>
    ? Task<TResult>
    : TReturn
  : void;

export type StaticStateValues<TState> = {
  [key in keyof TState]: TState[key] extends State<infer TValue>
    ? TValue extends Array<infer TItem>
      ? ReadonlyArray<TItem>
      : TValue extends {}
      ? Readonly<TValue>
      : TValue
    : TState[key];
};

export type ComputedStateValues<TState> = TState extends {
  computed: infer TComputed;
}
  ? {
      [key in keyof TComputed]: CombinerReturnType<
        TComputed[key],
        ComputedTuple<TComputed[key]>
      >;
    }
  : {};

export type CombinerReturnType<T, TFallback = never> = T extends (
  ...args: any[]
) => infer TReturn
  ? TReturn
  : TFallback;

export type ComputedTupleItem = string | Function | { [key: string]: any };

export type ComputedTuple<T> = T extends [
  ComputedTupleItem,
  ComputedTupleItem,
  infer TCombiner
]
  ? CombinerReturnType<TCombiner>
  : any;
