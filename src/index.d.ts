declare const tenx: Tenx;

export default tenx;

export interface Tenx extends Function {
  /**
   * get default hooks
   */
  (): TenxHooks;
  <TSelectedValue>(
    selector: () => TSelectedValue,
    handler: (value: TSelectedValue) => any
  ): Unwatch;
  /**
   * dispatch specified action with payload
   */

  /**
   * listen action dispatching
   */
  (action: "*" | string, listener: (action: Action) => any): RemoveListener;
  (action: "*" | string, listener: () => any): RemoveListener;
  (action: string, payload: any): void;
  /**
   * execute binding
   */
  <TPayload, TResult>(
    selector: (payload?: TPayload) => TResult,
    payload?: TPayload
  ): TResult;

  // noinspection SpellCheckingInspection
  (awaitables: Awaitable[]): Promise<any[]>;
  // noinspection SpellCheckingInspection
  (awaitables: Awaitable[], handler: (results: any[]) => any): RemoveListener;
  // noinspection SpellCheckingInspection
  <T>(awaitables: T): Promise<{ [key in keyof T]: ActionResultInfer<T[key]> }>;
  // noinspection SpellCheckingInspection
  <T>(
    awaitables: T,
    handler: (results: { [key in keyof T]: ActionResultInfer<T[key]> }) => any
  ): RemoveListener;
}

export type ActionResultInfer<T> = T extends string
  ? { type: string; payload: any }
  : any;

export type Awaitable = string | Promise<any>;

export interface Action<T = any> {
  readonly type: string;
  readonly payload: T;
}

export interface TenxHooks {
  cleanup: Function;
  on: Function;
  dispatch: Function;
  async: Function;
  binding: Function;
  watch: Function;
}

export type RemoveListener = () => void;

export type Unwatch = () => void;
