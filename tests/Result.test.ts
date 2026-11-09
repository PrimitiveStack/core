import { describe, expect, test } from 'bun:test';
import { err, ok, Result } from '../src/Result';

const isPromise = (value: unknown) =>
  typeof (value as { then?: unknown } | undefined)?.then === 'function';

describe('ok and err at runtime', () => {
  test('phantom parameters add no runtime property', () => {
    expect(Object.keys(ok(1))).toEqual(['isOk', 'value']);
    expect(Object.keys(err('x'))).toEqual(['isOk', 'error']);
  });
});

describe('Result.combine with sync entries', () => {
  test('returns a plain Result, not a Promise', () => {
    const result = Result.combine([ok(1), () => ok(2)] as const);

    expect(isPromise(result)).toBe(false);
    expect(result.isOk && result.value).toEqual([1, 2]);
  });

  test('keeps record keys', () => {
    const result = Result.combine({ a: ok(1), b: ok('x') });

    expect(result.isOk && result.value).toEqual({ a: 1, b: 'x' });
  });

  test('returns the first Err and does not call later getters', () => {
    let called = false;
    const result = Result.combine([
      () => err('boom'),
      () => {
        called = true;
        return ok(2);
      },
    ] as const);

    expect(result.isOk).toBe(false);
    expect(!result.isOk && result.error).toBe('boom');
    expect(called).toBe(false);
  });
});

describe('Result.combine with promises', () => {
  test('returns a Promise when an entry is a promise', async () => {
    const pending = Result.combine([ok(1), Promise.resolve(ok(2))] as const);

    expect(isPromise(pending)).toBe(true);

    const result = await pending;

    expect(result.isOk && result.value).toEqual([1, 2]);
  });

  test('returns the Err from a promise', async () => {
    const result = await Result.combine([ok(1), Promise.resolve(err('boom'))] as const);

    expect(result.isOk).toBe(false);
    expect(!result.isOk && result.error).toBe('boom');
  });

  test('keeps entry order when sync and promise entries are mixed', async () => {
    const result = await Result.combine([ok(1), () => Promise.resolve(ok(2)), ok(3)] as const);

    expect(result.isOk && result.value).toEqual([1, 2, 3]);
  });

  test('does not call later getters after an Err from a promise', async () => {
    let called = false;
    const result = await Result.combine([
      () => Promise.resolve(err('late')),
      () => {
        called = true;
        return ok(2);
      },
    ] as const);

    expect(result.isOk).toBe(false);
    expect(called).toBe(false);
  });

  test('keeps record keys with a promise entry', async () => {
    const result = await Result.combine({ a: ok(1), b: Promise.resolve(ok('x')) });

    expect(result.isOk && result.value).toEqual({ a: 1, b: 'x' });
  });

  test('an entry typed as maybe-a-promise that is sync returns a plain Result', () => {
    const maybe: Result<number, string> | Promise<Result<number, string>> = ok(1);
    const result = Result.combine([maybe] as const);

    expect(isPromise(result)).toBe(false);
  });
});
