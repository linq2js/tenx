export default function tenx<TModel = any>(
  model?: ModelInfer<TModel>
): Store<TModel>;

export interface StoreBase<TModel> {
  state: StoreStateInfer<TModel>;
  get<TValue = any>(name: string): DynamicState<TValue>;

  dispatch<ActionName extends keyof StoreActionPayloadInfer<TModel>>(
    type: ActionName | string,
    payload?: StoreActionPayloadInfer<TModel>[ActionName]
  ): any;
  delay(ms?: number): Promise<any>;

  when(
    action: string,
    listener: Listener<DispatchArgs<TModel>>
  ): RemoveListener;
  when(action: string): Promise<DispatchArgs<TModel>>;

  watch<TProp extends keyof StoreStateInfer<TModel>>(
    prop: TProp,
    callback: Listener<WatchArgs<TModel, StoreStateInfer<TModel>[TProp]>>
  ): RemoveListener;
  watch<TValue extends {}>(
    props: (keyof TValue)[],
    callback: Listener<WatchArgs<TModel, TValue>>
  ): RemoveListener;
  watch<TValue>(
    selector: (store: Store<TModel>) => TValue,
    callback: Listener<WatchArgs<TModel, TValue>>
  ): RemoveListener;
  watch<TProp extends keyof StoreStateInfer<TModel>>(
    prop: TProp
  ): Promise<WatchArgs<TModel, StoreStateInfer<TModel>[TProp]>>;
  watch<TValue extends {}>(
    props: (keyof TValue)[]
  ): Promise<WatchArgs<TModel, TValue>>;
  watch<TValue>(
    selector: (store: Store<TModel>) => TValue
  ): Promise<WatchArgs<TModel, TValue>>;

  onChange(listener: Listener<ChangeArgs<TModel>>): RemoveListener;
  onDispatch(listener: Listener<DispatchArgs<TModel>>): RemoveListener;

  cache<T>(data: T, ...keys: any[]): T;
}

export interface StoreExtras {
  debounce(ms?: number): void;
}

export type State<TValue> = { type: "state"; valueType: TValue };

export type Action<TPayload = never, TReturn = void> = {
  type: "action";
  payloadType: TPayload;
  returnType: TReturn;
};

export type Watch<TModel> = { [key: string]: Listener<WatchArgs<TModel, any>> };
export type When<TModel> = { [key: string]: Listener<DispatchArgs<TModel>> };

export type RemoveListener = () => void;

export type Computed<TValue = any> = { type: "computed"; valueType: TValue };

export type ModelInfer<TModel> =
  | ModelOptions<TModel>
  | (ModelStateInfer<TModel> &
      ModelActionInfer<TModel> &
      ModelComputedInfer<TModel> &
      ModelChildrenInfer<TModel>);

export type Store<TModel> = StoreBase<TModel> &
  { [key in keyof TModel]: StorePropInfer<TModel[key]> };

export type StorePropInfer<TType> = TType extends Action<
  infer TPayload,
  infer TReturn
>
  ? Dispatcher<TPayload, TReturn>
  : TType extends State<infer TValue>
  ? TValue
  : TType extends Computed<infer TValue>
  ? TValue
  : never;

export interface Dispatcher<TPayload, TReturn> extends Function {
  (payload?: TPayload): TReturn;
  fork(payload?: TPayload): TReturn;
}

export interface ModelOptions<TModel> {
  when?: When<TModel>;
  watch?: Watch<TModel>;
}

export type StoreStateInfer<TModel> =
  | {
      [key in keyof TModel]: TModel[key] extends State<infer TValue>
        ? TValue
        : never;
    }
  | {
      [key in keyof TModel]: TModel[key] extends Computed<infer TValue>
        ? TValue
        : never;
    };

export type ModelStateInfer<TModel> = {
  state: {
    [key in keyof TModel]?: TModel[key] extends State<infer TValue>
      ? TValue
      : never;
  };
};

export type ModelActionInfer<TModel> = {
  action: {
    [key in keyof TModel]?: TModel[key] extends Action<
      infer TPayload,
      infer TReturn
    >
      ? (
          store?: Store<TModel> & StoreExtras,
          payload?: TPayload
        ) => Generator | TReturn
      : never;
  };
};

export type ModelComputedInfer<TModel> = {
  computed: {
    [key in keyof TModel]?: TModel[key] extends Computed<infer TValue>
      ? ((store: Store<TModel>) => TValue) | [...(string | Function)[]]
      : never;
  };
};

export type ModelChildrenInfer<TModel> = {
  children: {
    [key in keyof TModel]?: TModel[key] extends Store<infer TValue>
      ? TValue
      : never;
  };
};

export type StoreActionPayloadInfer<TModel> = {
  [key in keyof TModel]: TModel[key] extends Action<infer TPayload, any>
    ? TPayload
    : never;
};

export interface Loadable<T = any> {
  readonly status: "loading" | "hasValue" | "hasError";
  readonly value: T;
  readonly error: any;
}

export interface DynamicState<T> extends Loadable<T> {
  value: T;
  readonly loadable: Loadable<T>;
  mutate(value: T): void;
  mutate(promise: Promise<T>, reducer: (resolved?: T, current?: T) => T): void;
  mutate(reducer: (current: T) => T): void;
}

export type Listener<T> = (args?: T) => any;

export interface StoreListenerArgs<TModel> {
  store: Store<TModel>;
}

export type DispatchArgs<TModel> = StoreListenerArgs<TModel> & {
  action: { type: string; payload: any };
};

export type ChangeArgs<TModel> = StoreListenerArgs<TModel>;

export type WatchArgs<TModel, TValue> = StoreListenerArgs<TModel> & {
  current: TValue;
  previous: TValue;
};
