import { Action, Computed, State } from "../index";

declare const snapshot: SnapshotExports;

export default snapshot;

export interface SnapshotExports extends Function {
  <TEntry>(): SnapshotStoreModel<TEntry>;
  <TEntry>(prop: string, options?: SnapshotOptions): SnapshotStoreModel<TEntry>;
  <TEntry>(
    props: (keyof TEntry)[],
    options?: SnapshotOptions
  ): SnapshotStoreModel<TEntry>;
}

export interface SnapshotStoreModel<TEntry> {
  all: State<TEntry[]>;
  index: State<number>;
  current: Computed<TEntry>;
  next: Computed<TEntry>;
  prev: Computed<TEntry>;
  nextAll: Computed<TEntry[]>;
  prevAll: Computed<TEntry[]>;
  go: Action<number, boolean>;
  revert: Action<number, boolean>;
  back: Action<never, boolean>;
  forward: Action<never, boolean>;
  create: Action<never, boolean>;
}

export interface SnapshotOptions {
  maxLength?: number;
  autoCreate?: boolean;
}
