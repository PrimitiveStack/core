import { ok, err, Result } from '../src/Result';

// An ordinary generic helper: takes a Result and returns it.
declare function passThrough<T, E>(r: Result<T, E>): Result<T, E>;

// 1. Passing a bare ok(). Hover `fromOk`: Result<number, unknown>
const fromOk = passThrough(ok(1));
export const a: Result<number, string> = fromOk; // ERROR: 'unknown' is not assignable to 'string'

// 2. Same, but passing a bare err(). Hover `fromErr`: Result<unknown, string>
const fromErr = passThrough(err('x'));
export const b: Result<number, string> = fromErr; // ERROR: 'unknown' is not assignable to 'number'

// 3. Same call, assigned directly. The expected type tells TypeScript what E is, so this works.
export const c: Result<number, string> = passThrough(ok(1)); // OK

// ---- Same code with phantom parameters (Ok carries E, Err carries T) ----
class OkP<A, E = never> {
  readonly isOk = true as const;
  constructor(readonly value: A) {}
}
class ErrP<T, E> {
  readonly isOk = false as const;
  constructor(readonly error: E) {}
}
type ResultP<T, E> = OkP<T, E> | ErrP<T, E>;
declare function okP<A>(value: A): OkP<A>;
declare function errP<E>(error: E): ErrP<never, E>;
declare function passThroughP<T, E>(r: ResultP<T, E>): ResultP<T, E>;

const fromOkP = passThroughP(okP(1));
export const d: ResultP<number, string> = fromOkP; // OK

const fromErrP = passThroughP(errP('x'));
export const e: ResultP<number, string> = fromErrP; // OK
