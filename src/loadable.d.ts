export default function loadable<T>(initial: T | Promise<T>): Loadable<T>;

export interface Loadable<T> extends LoadableData<T> {
  readonly data: LoadableData<T>;
  tryGetValue(defaultValue?: T): T;
}

export interface LoadableData<T> {
  readonly value: T;
  readonly error: any;
  readonly status: "loading" | "hasError" | "hasValue";
}
