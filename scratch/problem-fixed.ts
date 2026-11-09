import { ok, err, Result } from './ResultFixed';

const allOk = Result.combine([ok(1), ok(2)] as const);

// Was a compile error with the original GetErrValue. Should compile now.
export function load(): Result<readonly [number, number], string> {
  return allOk;
}

// Mixed case: the real Err must still be kept.
const mixed = Result.combine([ok(1), err('boom' as const)] as const);

// Should compile: error type is 'boom'.
export const okCase: Result<readonly [number, unknown], 'boom'> = mixed;

// Should NOT compile: error type is 'boom', not 'other'.
export const badCase: Result<readonly [number, unknown], 'other'> = mixed;
