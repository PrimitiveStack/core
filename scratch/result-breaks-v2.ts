// Error-type checks for Result: the repo's current shape vs a phantom-parameter shape.
//
// Every check asserts the exact expected error type. A wrong type makes the check
// print `false`, and `Expect` turns that into a compile error on that line.
//
// Run from this directory (scratch/):
//   ../node_modules/.bin/tsc --noEmit --strict --module esnext --moduleResolution bundler --target es2022 --skipLibCheck result-breaks-v2.ts

import { ok, err, Result } from '../src/Result';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// Error slot of a Result that is known to be Ok | Err: read the Err member's `error`.
type ErrSlot<R> = Extract<R, { isOk: false }> extends { error: infer E } ? E : never;

// Generic helper: infer the error type from any Result, the way a caller might write it.
type ErrOf<R> = R extends Result<unknown, infer E> ? E : never;

// ---------- Part A: the repo's current shape, Ok<T> | Err<E> ----------

const bareOk = ok(1);
const allOk = Result.combine([ok(1), ok(2)] as const);
const mixed = Result.combine([ok(1), err('boom' as const)] as const);

// A1. Bare Ok has no error type, so the error should be never. Actual: unknown. FAILS.
export type A1_bareOk_error = Expect<Equal<ErrOf<typeof bareOk>, never>>;

// A2. combine of only Ok values should have error never. Actual: unknown. FAILS.
export type A2_allOk_error = Expect<Equal<ErrSlot<typeof allOk>, never>>;

// A3. combine with one Err keeps the error type. Actual: 'boom'. PASSES.
export type A3_mixed_error = Expect<Equal<ErrSlot<typeof mixed>, 'boom'>>;

// A4. The generic helper on the same mixed result should also give 'boom'.
//     Actual: unknown, because the Ok member infers unknown and absorbs 'boom'. FAILS.
export type A4_mixed_errorViaHelper = Expect<Equal<ErrOf<typeof mixed>, 'boom'>>;

// ---------- Part B: phantom-parameter shape (upstream style, hand-written here) ----------
// OkP's E is a phantom parameter: it is never used in the body, so it is kept only for typing.

class OkP<A, E = never> {
  readonly isOk = true as const;
  constructor(readonly value: A) {}
}
class ErrP<T, E> {
  readonly isOk = false as const;
  constructor(readonly error: E) {}
}
type ResultP<T, E> = OkP<T, E> | ErrP<T, E>;
type ErrOfP<R> = R extends ResultP<unknown, infer E> ? E : never;

// B1. Bare Ok: error never. PASSES.
export type B1_bareOk_error = Expect<Equal<ErrOfP<OkP<number>>, never>>;

// B2. Union of Ok values only: error never. PASSES.
export type B2_allOk_error = Expect<Equal<ErrOfP<OkP<number> | OkP<string>>, never>>;

// B3. Union with one Err: error 'boom'. PASSES.
export type B3_mixed_error = Expect<Equal<ErrOfP<OkP<number> | ErrP<never, 'boom'>>, 'boom'>>;
