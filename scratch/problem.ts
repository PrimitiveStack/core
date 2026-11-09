import { ok, Result } from '../src/Result';

// Both values are Ok, so this can never fail.
const allOk = Result.combine([ok(1), ok(2)] as const);

// Hover `allOk` in VS Code. Its type is:
//   Result<readonly [number, number], unknown>
// The error type is `unknown`. It should be `never`, because no error is possible.

// This function promises: success is two numbers, error is a string.
export function load(): Result<readonly [number, number], string> {
  // COMPILE ERROR on the next line: 'unknown' is not assignable to 'string'.
  // The code is valid, but the compiler rejects it because of the `unknown`.
  return allOk;
}
