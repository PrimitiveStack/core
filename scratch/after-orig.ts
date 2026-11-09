import { ok, err, Result } from './ResultOrig';
const asyncMixed = Result.asyncCombine([ok(1), Promise.resolve(err('boom' as const))] as const);
export const a2: typeof asyncMixed = 1;
