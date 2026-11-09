import { ok, err, Result } from '../src/Result';

const tupleAllOk = Result.combine([ok(1), ok(2)] as const);
const tupleMixed = Result.combine([ok(1), err('boom' as const)] as const);
const recordAllOk = Result.combine({ a: ok(1), b: ok('x') });
const recordMixed = Result.combine({ a: ok(1), b: err('boom' as const) });
const asyncAllOk = Result.asyncCombine([ok(1), Promise.resolve(ok(2))] as const);
const asyncMixed = Result.asyncCombine([ok(1), Promise.resolve(err('boom' as const))] as const);

// Deliberate errors: each message prints the type.
export const t1: typeof tupleAllOk = 1;
export const t2: typeof tupleMixed = 1;
export const r1: typeof recordAllOk = 1;
export const r2: typeof recordMixed = 1;
export const a1: typeof asyncAllOk = 1;
export const a2: typeof asyncMixed = 1;

// Wrong error type must still be rejected.
export const bad: Result<readonly [number, never], 'other'> = tupleMixed;
