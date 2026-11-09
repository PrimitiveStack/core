import { ok, err, Result } from '../src/Result';

declare const maybe: Result<number, string> | Promise<Result<number, string>>;

const syncAllOk = Result.combine([ok(1), () => ok('x')] as const);
const syncMixed = Result.combine([ok(1), err('boom' as const)] as const);
const syncRecord = Result.combine({ a: ok(1), b: err('boom' as const) });

const valuePromise = Result.combine([ok(1), Promise.resolve(err('boom' as const))] as const);
const getterPromise = Result.combine([() => Promise.resolve(ok(1))] as const);
const recordPromise = Result.combine({ a: ok(1), b: Promise.resolve(err('boom' as const)) });
const maybePromise = Result.combine([ok(true), maybe] as const);

// Deliberate errors: each message prints the chosen return type.
export const s1: string = syncAllOk;
export const s2: string = syncMixed;
export const s3: string = syncRecord;
export const p1: string = valuePromise;
export const p2: string = getterPromise;
export const p3: string = recordPromise;
export const m1: string = maybePromise;
