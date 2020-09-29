import { State } from "../index";

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

export interface ArrayOptions<T> {
  shallowCompare?: boolean;
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
  set(key: (keyof T)[], value: any): T;
  set(key: keyof T, value: any): T;
  set(predicate: (key: string, value: any) => boolean, value: any): T;
  unset(predicate: (key: string, value: any) => boolean): T;
  unset(...keys: (keyof T)[]): T;
  assign(...values: Partial<T>[]): T;
  swap(a: keyof T, b: keyof T): T;
}

export function shallowMemo<T>(oldValue: T, newValue: T): T;

export interface EntitySetState<TEntity, TId>
  extends State<{ entities: { [key: string]: TEntity }; ids: TId[] }> {
  updateIn(...entities: { [key: string]: any }[]): void;
  update(...entities: TEntity[]): void;
  merge(...entities: Partial<TEntity>[]): void;
  remove(...ids: TId[]): void;
}
