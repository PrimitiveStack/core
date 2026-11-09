import { ok, err, Result } from '../src/Result';

// Right values: should compile.
export const a: Result<number, string> = ok(1);
export const b: Result<number, string> = err('x');

// Wrong values: should NOT compile.
export const c: Result<number, string> = ok('x'); // wrong success type
export const d: Result<number, string> = err(1); // wrong error type

// A function with branches: should compile.
export function parse(s: string): Result<number, string> {
  const n = Number(s);
  if (Number.isNaN(n)) return err('not a number');
  return ok(n);
}

// Passing a Result with a different error type: should NOT compile.
declare const strErr: Result<number, string>;
export const e: Result<number, number> = strErr;

// Passing a Result into a wider Result: should compile.
export const f: Result<number | string, string | Error> = strErr;

// Reading the value after checking isOk: should compile.
export function read(r: Result<number, string>): number | string {
  if (r.isOk) return r.value;
  return r.error;
}
