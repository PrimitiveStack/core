import { toPairs } from 'ramda';
import type { UnknownRecord, Simplify, Promisable } from 'type-fest';

export class Ok<T> {
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

export class Err<E> {
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

export type Result<T, E> = Ok<T> | Err<E>;

export function ok(): Ok<undefined>;
export function ok<T>(value: T): Ok<T>;
export function ok(value?: unknown) {
  return new Ok(value);
}

export function err(): Err<undefined>;
export function err<E>(error: E): Err<E>;
export function err(error?: unknown) {
  return new Err(error);
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

  type MappedReturnType<T> = {
    [i in keyof T]: T[i] extends () => infer TOk ? TOk : T[i];
  };

  type TupleOfUnknownResults = readonly (UnknownResult | (() => UnknownResult))[];
  type RecordOfUnknownResults = Record<PropertyKey, UnknownResult | (() => UnknownResult)>;

  export function combine<const TResultsTuple extends TupleOfUnknownResults>(
    results: TResultsTuple,
  ): Result<
    MappedOkValues<MappedReturnType<TResultsTuple>>,
    GetErrValue<MappedReturnType<TResultsTuple>, number>
  >;

  export function combine<TResultsRecord extends RecordOfUnknownResults>(
    results: TResultsRecord,
  ): Result<
    MappedOkValues<MappedReturnType<TResultsRecord>>,
    GetErrValue<MappedReturnType<TResultsRecord>>
  >;

  export function combine(results: TupleOfUnknownResults | RecordOfUnknownResults) {
    if (Array.isArray(results)) {
      const unwrappedOkValues = [];

      for (const resultOrGetter of results as TupleOfUnknownResults) {
        const result = typeof resultOrGetter === 'function' ? resultOrGetter() : resultOrGetter;

        if (!result.isOk) return result;

        unwrappedOkValues.push(result.value);
      }

      return ok(unwrappedOkValues);
    }

    const unwrappedOkValues: UnknownRecord = {};

    for (const [key, resultOrGetter] of toPairs(results as RecordOfUnknownResults)) {
      const result = typeof resultOrGetter === 'function' ? resultOrGetter() : resultOrGetter;

      if (!result.isOk) return result;

      unwrappedOkValues[key] = result.value;
    }

    return ok(unwrappedOkValues);
  }

  type MappedAsyncReturnType<T> = {
    [i in keyof T]: T[i] extends () => Promise<infer TOk> ? TOk : T[i];
  };

  type AsyncTupleOfUnknownResults = readonly (
    | Promisable<UnknownResult>
    | (() => Promisable<UnknownResult>)
  )[];
  type AsyncRecordOfUnknownResults = Record<
    PropertyKey,
    Promisable<UnknownResult> | (() => Promisable<UnknownResult>)
  >;

  export function asyncCombine<const TAsyncResultsTuple extends AsyncTupleOfUnknownResults>(
    results: TAsyncResultsTuple,
  ): Promise<
    Result<
      MappedOkValues<MappedAsyncReturnType<TAsyncResultsTuple>>,
      GetErrValue<MappedAsyncReturnType<TAsyncResultsTuple>, number>
    >
  >;

  export function asyncCombine<TAsyncResultsRecord extends AsyncRecordOfUnknownResults>(
    results: TAsyncResultsRecord,
  ): Promise<
    Result<
      MappedOkValues<MappedAsyncReturnType<TAsyncResultsRecord>>,
      GetErrValue<MappedAsyncReturnType<TAsyncResultsRecord>>
    >
  >;

  export async function asyncCombine(
    results: AsyncTupleOfUnknownResults | AsyncRecordOfUnknownResults,
  ) {
    if (Array.isArray(results)) {
      const unwrappedOkValues = [];

      for (const resultOrGetter of results as AsyncTupleOfUnknownResults) {
        const result =
          typeof resultOrGetter === 'function' ? await resultOrGetter() : await resultOrGetter;

        if (!result.isOk) return result;

        unwrappedOkValues.push(result.value);
      }

      return ok(unwrappedOkValues);
    }

    const unwrappedOkValues: UnknownRecord = {};

    for (const [key, resultOrGetter] of toPairs(results as AsyncRecordOfUnknownResults)) {
      const result =
        typeof resultOrGetter === 'function' ? await resultOrGetter() : await resultOrGetter;

      if (!result.isOk) return result;

      unwrappedOkValues[key] = result.value;
    }

    return ok(unwrappedOkValues);
  }
}
