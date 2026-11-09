import assert from 'node:assert/strict';
import { ok, err, Result } from '../src/Result';

const isThenable = (value: unknown) => typeof (value as { then?: unknown })?.then === 'function';

// 1. All sync: returns a plain Result, not a promise.
const sync = Result.combine([ok(1), () => ok(2)] as const);
assert.equal(isThenable(sync), false);
assert.equal(sync.isOk, true);
assert.deepEqual(sync.isOk && sync.value, [1, 2]);

// 2. Sync error short-circuits: the next getter is never called.
let calledAfterErr = false;
const syncErr = Result.combine([() => err('boom'), () => { calledAfterErr = true; return ok(2); }] as const);
assert.equal(isThenable(syncErr), false);
assert.equal(syncErr.isOk, false);
assert.equal(calledAfterErr, false);

// 3. Sync record.
const record = Result.combine({ a: ok(1), b: ok('x') });
assert.deepEqual(record.isOk && record.value, { a: 1, b: 'x' });

// 4. A promise entry: returns a promise, resolves to the combined Result.
const withPromise = Result.combine([ok(1), Promise.resolve(ok(2))] as const);
assert.equal(isThenable(withPromise), true);
const awaited = await withPromise;
assert.deepEqual(awaited.isOk && awaited.value, [1, 2]);

// 5. A promise that resolves to an Err.
const promiseErr = await Result.combine([ok(1), Promise.resolve(err('boom'))] as const);
assert.equal(promiseErr.isOk, false);
assert.equal(!promiseErr.isOk && promiseErr.error, 'boom');

// 6. Order is kept when sync, promise, and sync entries are mixed.
const ordered = await Result.combine([ok(1), () => Promise.resolve(ok(2)), ok(3)] as const);
assert.deepEqual(ordered.isOk && ordered.value, [1, 2, 3]);

// 7. A getter that returns a promise: later getters are not called after an Err.
let calledAfterAsyncErr = false;
const asyncErr = await Result.combine([
  () => Promise.resolve(err('late')),
  () => { calledAfterAsyncErr = true; return ok(2); },
] as const);
assert.equal(asyncErr.isOk, false);
assert.equal(calledAfterAsyncErr, false);

// 8. Record with a promise entry.
const recordAsync = await Result.combine({ a: ok(1), b: Promise.resolve(ok('x')) });
assert.deepEqual(recordAsync.isOk && recordAsync.value, { a: 1, b: 'x' });

// 9. An entry typed as maybe-a-promise that resolves synchronously returns a plain Result.
const maybe: Result<number, string> | Promise<Result<number, string>> = ok(1);
const maybeSync = Result.combine([maybe] as const);
assert.equal(isThenable(maybeSync), false);

console.log('all runtime checks passed');
