import { describe, expect, test } from 'tstyche';
import { err, ok, Result, type Err, type Ok } from '../../src/Result';

declare const maybe: Result<number, string> | Promise<Result<number, string>>;

// A bare ok() or err() must not turn the other type parameter into unknown.
declare function passThrough<T, E>(result: Result<T, E>): Result<T, E>;

describe('phantom parameters', () => {
  test('Ok carries its error type', () => {
    expect<Ok<number, string>>().type.not.toBe<Ok<number, number>>();
    expect<Ok<number, string>>().type.not.toBeAssignableTo<Ok<number, number>>();
  });

  test('Ok<T, never> is assignable to Ok<T, E> for any E', () => {
    expect<Ok<number, never>>().type.toBeAssignableTo<Ok<number, string>>();
    expect<Ok<number, never>>().type.toBeAssignableTo<Ok<number, number>>();
  });

  test('Err carries its success type', () => {
    expect<Err<number, string>>().type.not.toBe<Err<string, string>>();
    expect<Err<number, string>>().type.not.toBeAssignableTo<Err<string, string>>();
  });

  test('Err<never, E> is assignable to Err<T, E> for any T', () => {
    expect<Err<never, string>>().type.toBeAssignableTo<Err<number, string>>();
    expect<Err<never, string>>().type.toBeAssignableTo<Err<string, string>>();
  });
});

describe('ok and err', () => {
  test('are assignable to a matching Result<T, E>', () => {
    expect(ok(1)).type.toBeAssignableTo<Result<number, string>>();
    expect(err('x')).type.toBeAssignableTo<Result<number, string>>();
  });

  test('reject a wrong success type', () => {
    // @ts-expect-error Type 'Ok<string, never>' is not assignable to type 'Result<number, string>'
    const wrong: Result<number, string> = ok('x');

    expect(wrong).type.toBe<Result<number, string>>();
  });

  test('reject a wrong error type', () => {
    // @ts-expect-error Type 'Err<never, number>' is not assignable to type 'Result<number, string>'
    const wrong: Result<number, string> = err(1);

    expect(wrong).type.toBe<Result<number, string>>();
  });

  test('a Result with another error type is not assignable', () => {
    expect<Result<number, string>>().type.not.toBeAssignableTo<Result<number, number>>();
  });
});

describe('Result passed through a generic function', () => {
  test('a bare ok() keeps the error type assignable', () => {
    const fromOk = passThrough(ok(1));

    expect(fromOk).type.toBeAssignableTo<Result<number, string>>();
  });

  test('a bare err() keeps the success type assignable', () => {
    const fromErr = passThrough(err('x'));

    expect(fromErr).type.toBeAssignableTo<Result<number, string>>();
  });
});

describe('Result.combine with sync entries', () => {
  test('only Ok entries have error type never', () => {
    const allOk = Result.combine([ok(1), () => ok('x')] as const);

    expect(allOk).type.toBe<Result<readonly [number, string], never>>();
  });

  test('an Ok and an Err keep the Err error type', () => {
    const mixed = Result.combine([ok(1), err('boom' as const)] as const);

    expect(mixed).type.toBe<Result<readonly [number, never], 'boom'>>();
    expect(mixed).type.not.toBe<Result<readonly [number, never], 'other'>>();
  });

  test('a record gives the same result', () => {
    const record = Result.combine({ a: ok(1), b: err('boom' as const) });

    expect(record).type.toBe<Result<{ a: number; b: never }, 'boom'>>();
  });

  test('is assignable to a Result with a wider error type', () => {
    const allOk = Result.combine([ok(1), ok(2)] as const);

    expect(allOk).type.toBeAssignableTo<Result<readonly [number, number], string>>();
  });
});

describe('Result.combine with promises', () => {
  test('a promise entry returns a Promise', () => {
    const value = Result.combine([ok(1), Promise.resolve(err('boom' as const))] as const);

    expect(value).type.toBe<Promise<Result<readonly [number, never], 'boom'>>>();
  });

  test('a function returning a promise returns a Promise', () => {
    const getter = Result.combine([() => Promise.resolve(ok(1))] as const);

    expect(getter).type.toBe<Promise<Result<readonly [number], never>>>();
  });

  test('a record with a promise returns a Promise', () => {
    const record = Result.combine({ a: ok(1), b: Promise.resolve(err('boom' as const)) });

    expect(record).type.toBe<Promise<Result<{ a: number; b: never }, 'boom'>>>();
  });

  test('an entry that may be a promise returns Result | Promise<Result>', () => {
    const value = Result.combine([ok(true), maybe] as const);

    expect(value).type.toBe<
      | Result<readonly [boolean, number], string>
      | Promise<Result<readonly [boolean, number], string>>
    >();
  });

  test('a sync call is not a Promise', () => {
    const value = Result.combine([ok(1), ok(2)] as const);

    expect(value).type.not.toBeAssignableTo<Promise<unknown>>();
  });
});
