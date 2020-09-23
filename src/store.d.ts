export default function store<T>(
  options: StoreOptions<T>
): T & Store<T> & ExtraProps;

export interface StoreOptions<T = any> {
  initial?: T;
  maxSnapshot?: number;
}

export interface ExtraProps {
  [key: string]: any;
}

export interface Store<T> {
  readonly snapshot: Snapshot<T>;
  reset(): void;
  reset(data: T): void;
}

export interface Snapshot<T> {
  readonly list: T[];
  create(): T;
  clear(): void;
  remove(index: number): void;
  revert(index: number): void;
}
