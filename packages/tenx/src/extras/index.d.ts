import { Cancellable, State, Store, StoreStateInfer } from "../lib";

export function array<T = any>(
  initial: T[],
  options: ArrayOptions<T>
): ArrayState<T>;

export function entity<T = {}>(initial: T): EntityState<T>;
export function entitySet<TEntity, TId = any>(
  entities: TEntity[],
  selectId?: (entity: TEntity) => TId
): EntitySetState<TEntity, TId>;

export function entitySet<TEntity, TId = any>(
  entities: TEntity[],
  options: { selectId?: (entity: TEntity) => TId }
): EntitySetState<TEntity, TId>;

export function snapshot<TStore extends Store<any, any>>(
  store: TStore
): SnapshotStore<Omit<StoreStateInfer<TStore>, "computed">>;

export function snapshot<TStore extends Store<any, any>>(
  store: TStore,
  options: SnapshotOptions
): SnapshotStore<Omit<StoreStateInfer<TStore>, "computed">>;

export function snapshot<
  TStore extends Store<any, any>,
  TKey extends keyof Omit<StoreStateInfer<TStore>, "computed">
>(
  store: TStore,
  prop: TKey,
  options?: SnapshotOptions
): SnapshotStore<StoreStateInfer<TStore>[TKey]>;

export function snapshot<TModel>(
  store: Store<Required<TModel>, {}>,
  props: (keyof TModel)[],
  options?: SnapshotOptions
): SnapshotStore<TModel>;

export interface SnapshotOptions {
  maxLength?: number;
}

export interface ArrayOptions<T> {
  shallowCompare?: boolean;
}

export interface SnapshotStore<TEntity> {
  all: TEntity[];
  index: number;
  current: TEntity | undefined;
  prev: TEntity | undefined;
  next: TEntity | undefined;
  prevAll: TEntity[];
  nextAll: TEntity[];
  go(number: number): void;
  back(): void;
  forward(): void;
  revert(index: number): void;
  clear(): void;
}

export interface ArrayState<T> extends State<T[]> {
  (state: State<any>): this;
  push(...items: T[]): void;
  pop(): T | undefined;
  shift(): T | undefined;
  unshift(...items: T[]): void;
  splice(
    index: number,
    predicate: (value?: T, index?: number) => boolean,
    ...items: T[]
  ): T[];
  splice(index?: number, length?: number, ...items: T[]): T[];
  slice(from?: number, to?: number): T[];
  sort(fn: (a?: T, b?: T) => number): void;
  orderBy<TResult>(selector?: (item: T) => TResult, order?: 1 | -1): void;
  map(mapper: (item?: T, index?: number) => T): T[];
  filter(predicate: (item?: T, index?: number) => boolean): T[];
  swap(a: number, b: number): void;
}

export interface EntityState<T> extends State<T> {
  (state: State<any>): this;
  set(values: Partial<T>): T;
  set(key: (keyof T)[], value: any): T;
  set(key: keyof T, value: any): T;
  set(predicate: (key: string, value: any) => boolean, value: any): T;
  unset(predicate: (key: string, value: any) => boolean): T;
  unset(...keys: (keyof T)[]): T;
  assign(...values: Partial<T>[]): T;
  swap(a: keyof T, b: keyof T): T;
}

export function shallowMemo<T>(oldValue: T, newValue: T): T;

export function delay(ms?: number): Promise<any>;

export function cancellable<T>(target: Promise<T>): Promise<T> & Cancellable;
export function cancellable<TFunc extends (...args: any[]) => any>(
  func: TFunc
): (
  ...args: Parameters<TFunc>
) => Promise<PromiseResolved<ReturnType<TFunc>>> & Cancellable;

export type PromiseResolved<T> = T extends Promise<infer TResolved>
  ? TResolved
  : never;

export interface EntitySetStateApi<TEntity> {
  array<TResult>(
    mapper: (entity?: TEntity) => TResult,
    filter?: (entity?: TEntity) => boolean
  ): TResult[];
  map<TResult>(
    mapper: (entity?: TEntity) => TResult,
    filter?: (entity?: TEntity) => boolean
  ): { [key: string]: TResult };
  reduce<TSeed, TResult>(
    reducer: (seed?: TSeed, entity?: TEntity) => TResult,
    seed?: TSeed
  ): TResult;
}

export interface EntitySetStateValue<TEntity, TId>
  extends EntitySetStateApi<TEntity> {
  entities: { [key: string]: TEntity };
  ids: TId[];
}

export interface EntitySetState<TEntity, TId>
  extends State<EntitySetStateValue<TEntity, TId>>,
    EntitySetStateApi<TEntity> {
  updateIn(...entities: { [key: string]: any }[]): void;
  update(predicate: (entity: TEntity) => TEntity | boolean): void;
  update(...entities: TEntity[]): void;
  merge(...entities: Partial<TEntity>[]): void;
  remove(predicate: (entity: TEntity) => boolean): void;
  remove(...ids: TId[]): void;
}

export function tuple<T1, T2>(p1: T1, p2: T2): [T1, T2];
export function tuple<T1, T2, T3>(p1: T1, p2: T2, p3: T3): [T1, T2, T3];
export function tuple<T1, T2, T3, T4>(
  p1: T1,
  p2: T2,
  p3: T3,
  p4: T4
): [T1, T2, T3, T4];
export function tuple<T1, T2, T3, T4, T5>(
  p1: T1,
  p2: T2,
  p3: T3,
  p4: T4,
  p5: T5
): [T1, T2, T3, T4, T5];
export function tuple<T1, T2, T3, T4, T5, T6>(
  p1: T1,
  p2: T2,
  p3: T3,
  p4: T4,
  p5: T5,
  p6: T6
): [T1, T2, T3, T4, T5, T6];
export function tuple<T1, T2, T3, T4, T5, T6, T7>(
  p1: T1,
  p2: T2,
  p3: T3,
  p4: T4,
  p5: T5,
  p6: T6,
  p7: T7
): [T1, T2, T3, T4, T5, T6, T7];
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8>(
  p1: T1,
  p2: T2,
  p3: T3,
  p4: T4,
  p5: T5,
  p6: T6,
  p7: T7,
  p8: T8
): [T1, T2, T3, T4, T5, T6, T7, T8];
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  p1: T1,
  p2: T2,
  p3: T3,
  p4: T4,
  p5: T5,
  p6: T6,
  p7: T7,
  p8: T8,
  p9: T9
): [T1, T2, T3, T4, T5, T6, T7, T8, T9];
