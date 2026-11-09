import { toPairs } from 'ramda';
import type { UnknownRecord, Simplify, Promisable } from 'type-fest';

// `E` is a phantom parameter: it exists only in the type, so a bare `Ok` still carries an error type.
// `declare` emits no runtime property. The optional property makes `Ok<number, string>` and
// `Ok<number, number>` different types, and keeps `Ok<number, never>` assignable to both.
export class Ok<T, E = never> {
  declare readonly phantomError?: E;
  readonly isOk = true;
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  getOrThrow() {
    return this.value;
  }

  get unwrapped() {
    return this.value;
  }
}

// `T` is a phantom parameter: it exists only in the type, so a bare `Err` still carries a success type.
// `declare` emits no runtime property. `Err<never, E>` stays assignable to `Err<number, E>`.
export class Err<T, E> {
  declare readonly phantomValue?: T;
  readonly isOk = false;
  readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  getOrThrow(): never {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw this.error;
  }

  get unwrapped() {
    return this.error;
  }
}

export type Result<T, E> = Ok<T, E> | Err<T, E>;

export function ok(): Ok<undefined>;
export function ok<T>(value: T): Ok<T>;
export function ok(value?: unknown) {
  return new Ok(value);
}

export function err(): Err<never, undefined>;
export function err<E>(error: E): Err<never, E>;
export function err(error?: unknown) {
  return new Err<never, unknown>(error);
}

export namespace Result {
  type UnknownResult = Result<unknown, unknown>;

  type MappedOkValues<T> = Simplify<{
    [i in keyof T]: T[i] extends Result<infer TOk, unknown> ? TOk : never;
  }>;

  type GetErrValue<T, TValue extends keyof T = keyof T> = T[TValue] extends Result<
    unknown,
    infer TErr
  >
    ? TErr
    : never;

  // Each entry may be a Result, a Promise of one, or a function returning either.
  type MappedReturnType<T> = {
    [i in keyof T]: Awaited<T[i] extends () => infer TReturn ? TReturn : T[i]>;
  };

  type SyncEntry = UnknownResult | (() => UnknownResult);
  type AnyEntry = Promisable<UnknownResult> | (() => Promisable<UnknownResult>);

  type SyncTuple = readonly SyncEntry[];
  type SyncRecord = Record<PropertyKey, SyncEntry>;
  type AnyTuple = readonly AnyEntry[];
  type AnyRecord = Record<PropertyKey, AnyEntry>;

  type EntryReturn<TEntry> = TEntry extends () => infer TReturn ? TReturn : TEntry;

  // True only when the entry is always a promise. A `Result | Promise<Result>` entry is not.
  type IsDefinitelyPromise<TEntry> = [EntryReturn<TEntry>] extends [PromiseLike<unknown>]
    ? true
    : false;

  type DefinitePromiseFlags<T> = { [i in keyof T]: IsDefinitelyPromise<T[i]> };

  type HasDefinitePromise<T> = T extends readonly unknown[]
    ? true extends DefinitePromiseFlags<T>[number]
      ? true
      : false
    : true extends DefinitePromiseFlags<T>[keyof T]
      ? true
      : false;

  // A definite promise forces a Promise. A maybe-promise entry gives Result | Promise<Result>.
  type Pending<T, TResult> =
    HasDefinitePromise<T> extends true ? Promise<TResult> : TResult | Promise<TResult>;

  function isPromiseLike(value: unknown): value is PromiseLike<UnknownResult> {
    return typeof (value as { then?: unknown } | undefined)?.then === 'function';
  }

  // Sync entries only: returns a Result.
  export function combine<const TResultsTuple extends SyncTuple>(
    results: TResultsTuple,
  ): Result<
    MappedOkValues<MappedReturnType<TResultsTuple>>,
    GetErrValue<MappedReturnType<TResultsTuple>, number>
  >;

  export function combine<TResultsRecord extends SyncRecord>(
    results: TResultsRecord,
  ): Result<
    MappedOkValues<MappedReturnType<TResultsRecord>>,
    GetErrValue<MappedReturnType<TResultsRecord>>
  >;

  // At least one entry may be a promise: returns a Promise, or Result | Promise when a promise is only possible.
  export function combine<const TResultsTuple extends AnyTuple>(
    results: TResultsTuple,
  ): Pending<
    TResultsTuple,
    Result<
      MappedOkValues<MappedReturnType<TResultsTuple>>,
      GetErrValue<MappedReturnType<TResultsTuple>, number>
    >
  >;

  export function combine<TResultsRecord extends AnyRecord>(
    results: TResultsRecord,
  ): Pending<
    TResultsRecord,
    Result<
      MappedOkValues<MappedReturnType<TResultsRecord>>,
      GetErrValue<MappedReturnType<TResultsRecord>>
    >
  >;

  export function combine(results: AnyTuple | AnyRecord): unknown {
    const isTuple = Array.isArray(results);
    const entries: (readonly [PropertyKey, AnyEntry])[] = isTuple
      ? (results as AnyTuple).map((entry, index) => [index, entry] as const)
      : toPairs(results as AnyRecord);
    const unwrappedOkValues: unknown[] | UnknownRecord = isTuple ? [] : {};

    const collect = (key: PropertyKey, value: unknown) => {
      if (Array.isArray(unwrappedOkValues)) unwrappedOkValues.push(value);
      else unwrappedOkValues[key] = value;
    };

    // Runs entries in order. Stays sync until an entry is a promise, then continues as a promise.
    const run = (start: number): UnknownResult | Promise<UnknownResult> => {
      for (let i = start; i < entries.length; i++) {
        const [key, entry] = entries[i]!;
        const pending = typeof entry === 'function' ? entry() : entry;

        if (isPromiseLike(pending)) {
          return Promise.resolve(pending).then((result) => {
            if (!result.isOk) return result;

            collect(key, result.value);

            return run(i + 1);
          });
        }

        if (!pending.isOk) return pending;

        collect(key, pending.value);
      }

      return ok(unwrappedOkValues);
    };

    return run(0);
  }
}
