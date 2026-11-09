import { ok, Result } from '../src/Result';

type R = Result<unknown, unknown>;
type SyncEntry = R | (() => R);
type AnyEntry = SyncEntry | PromiseLike<R> | (() => PromiseLike<R>);

// Overload 1 accepts only sync entries. Overload 2 accepts anything, so it is picked when a promise appears.
declare function combine<const T extends readonly SyncEntry[]>(results: T): Result<unknown[], unknown>;
declare function combine<const T extends readonly AnyEntry[]>(results: T): Promise<Result<unknown[], unknown>>;

const allSync = combine([ok(1), () => ok(2)]);
const valuePromise = combine([ok(1), Promise.resolve(ok(2))]);
const getterPromise = combine([() => Promise.resolve(ok(2))]);

// Deliberate errors: each message prints the chosen return type.
export const t1: string = allSync;
export const t2: string = valuePromise;
export const t3: string = getterPromise;
