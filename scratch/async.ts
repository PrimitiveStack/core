import { ok, err, Result } from '../src/Result';

// Three input forms: plain Result, Promise of Result, function returning Promise of Result.
const plainPromiseMixed = Result.asyncCombine([ok(1), Promise.resolve(err('boom' as const))] as const);
const fnPromiseMixed = Result.asyncCombine([() => Promise.resolve(ok(1)), () => Promise.resolve(err('boom' as const))] as const);
const fnSyncMixed = Result.asyncCombine([() => ok(1), () => err('boom' as const)] as const);
const allOk = Result.asyncCombine([ok(1), Promise.resolve(ok('x'))] as const);
const record = Result.asyncCombine({ a: Promise.resolve(ok(1)), b: () => Promise.resolve(err('boom' as const)) });

// Deliberate errors: each message prints the type.
export const t1: typeof plainPromiseMixed = 1;
export const t2: typeof fnPromiseMixed = 1;
export const t3: typeof fnSyncMixed = 1;
export const t4: typeof allOk = 1;
export const t5: typeof record = 1;
