# Type-level testing for `src/Result.ts`

Date: 2026-11-09. Repo pins TypeScript 5.8.3 and Bun 1.3.8 (`packageManager`). Local Bun is 1.3.14.

Labels used below:
- **[source]**: stated in the linked primary source (docs, README, source file, npm registry).
- **[ran]**: I ran it in a scratch directory outside the repo (`scratchpad/exp`, `scratchpad/tstyche-trial`) with TypeScript 5.8.3.
- **[inference]**: my reasoning, not checked.

## 1. Recommendation

**Primary: `tstyche` 7.2.5.** It is a dedicated type-test runner. It uses the project's local TypeScript (5.8.3). It separates exact identity (`.type.toBe`) from assignability (`.type.toBeAssignableTo`), has negation (`.not`), and reports failures with file and line.

Install and run (Bun):

```sh
bun add -d tstyche
```

`package.json` scripts:

```json
{
  "scripts": {
    "test": "bun test && bun run test:types",
    "test:types": "tstyche"
  }
}
```

- Run types only: `bun run test:types` (or `bun x tstyche`). Verified with `bun x tstyche` on Bun 1.3.14 [ran].
- Type test files use the `*.tst.ts` suffix. `bun test` does not pick them up. Its default file pattern is `{.test,.spec,_test_,_spec_}.{js,ts,...}` [ran: `bun test` output listed that pattern].
- Put the test files in a folder such as `tests/types/`. Run `bun x tstyche --listFiles` to check which files tstyche collects. I did not confirm how tstyche chooses files with `--tsconfig` (see §4).

**Fallback, zero-runner option: `expect-type` 1.4.0 with `tsc --noEmit`.** Use it if you do not want another dev dependency.

**Avoid:**
- `dtslint`: npm marks it deprecated, and Microsoft's README points to other tools [source: https://github.com/microsoft/DefinitelyTyped-tools/blob/main/packages/dtslint/README.md].
- `eslint-plugin-expect-type`: needs ESLint and typed linting. This repo lints with Biome (`biome.json`).
- `@ark/attest`: its docs say "This package is still in alpha!" It needs a global setup in Vitest or Mocha [source: https://arktype.io/docs/attest].
- `ts-toolbelt` and `conditional-type-checks`: last published in 2021 and 2022.
- `@type-challenges/utils`: last published in 2020. Copy the one-line `Equal` definition instead.
- `bun check` and `bun test --check`: they need Bun 1.4.3 or later. Local Bun 1.3.14 has no `bun check` [ran]. Bun says `bun check` reports errors "the same as tsc from TypeScript 7" [source: https://bun.com/docs/runtime/check]. That does not match the pinned 5.8.3.

**One finding to decide on before writing tests (affects all tools):**
The phantom parameters `_E` on `Ok` and `_T` on `Err` do not affect type identity or assignability on their own [ran]. `Equal<Ok<number, string>, Ok<number, number>>` is `true`, and `Ok<number, number>` is assignable to `Ok<number, string>`. Tests on `Result<T, E>` do work: `Result<number, string>` and `Result<number, never>` are not equal, because `Err` stores `E`. Either accept this and test only `Result<T, E>`, or change `Result.ts` so the phantom affects the structure. The second option is a source change, which I did not make.

## 2. Comparison

| Tool | Latest version (npm publish date) | Maintenance signal | How it checks | Exact equality | Negative tests | Overloads / generics | Bun | Extra deps | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| **tstyche** | 7.2.5 (2026-09-10) | Active; 7.x series | Own runner over the TypeScript compiler, local `typescript` [source: tstyche.org/get-started/first-steps] | `.type.toBe<T>()` [source: tstyche.org/reference/expect-api]; phantom-blind [ran] | `.type.not`; `// @ts-expect-error <message fragment>` required [ran] | `.toBeCallableWith` listed in docs; not tested | `bun x tstyche` works [ran]; engines `node >=22` [npm] | `typescript` peer only [npm] | **Primary** |
| expect-type | 1.4.0 (2026-06-25) | Active | Runtime no-op; errors come from `tsc` or the IDE [source: github.com/mmkal/expect-type] | `.toEqualTypeOf` using the TS identity operator [source: raw utils.ts] | `.not`; `// @ts-expect-error` [source: README] | Warns that `toBeCallableWith` may fail with overloads [source: README] | Works; no runtime code | None listed on npm | **Fallback** |
| Vitest typecheck | 5.1.0 (2026-11-02) | Active | Runs `tsc --noEmit`, parses output [source: vitest.dev/guide/testing-types] | `expectTypeOf().toEqualTypeOf` | `.not`; `assertType` + `@ts-expect-error` [source] | Same as expect-type | Not verified | Full `vitest` (Node `^22.12.0 \|\| ^24.0.0 \|\| >=26.0.0`) | Only if the project adopts Vitest |
| tsd | 0.33.0 (2025-08-05) | Last release about 15 months ago | `tsd` CLI on `.test-d.ts` [source: github.com/tsdjs/tsd] | `expectType` ("identical") [source] | `expectNotType`, `expectNotAssignable`, `expectError` [source] | Not verified | Not verified | `tsd` (Node `>=14.16`) | Secondary; stale |
| type-challenges `Equal` | Copied definition (repo active) | Repo active; npm utils 0.1.1 (2020-09-07) | Plain `tsc` | Identity operator [source: utils/index.d.ts] | `// @ts-expect-error` | Manual | Yes | None | Use as inline helper |
| eslint-plugin-expect-type | 0.7.0 (2026-09-19) | Active | ESLint rule `expect` on `$ExpectType`/`$ExpectError` [source] | Yes | Yes | Not verified | Not verified | ESLint, typescript-eslint | Avoid here |
| dtslint | 4.2.1 (2021-11-18) | Deprecated on npm | — | — | — | — | — | — | Avoid |
| @ark/attest | 0.58.0 (2026-10-22) | Alpha | Runtime type snapshots [source] | Not documented | Not documented | Not verified | Bun support pending [source] | `@ark/attest`, Vitest or Mocha | Avoid |
| conditional-type-checks | 1.0.6 (2022-06-18) | Stale | Plain `tsc` | `IsExact` [source] | Manual | Not verified | Yes | None | Avoid |
| ts-toolbelt `Test` | 9.6.0 (2021-03-10) | Stale | Plain `tsc` [source] | `Test.Pass` only documented [source] | Not documented | Not verified | Yes | Large package | Avoid |
| `bun check` / `bun test --check` | Bun 1.4.3 (2026-10-10) | Built into Bun | Bun's own checker [source: bun.com/blog/bun-v1.4.3] | — | — | — | **Needs Bun ≥1.4.3; local 1.3.14 lacks it [ran]** | None | Not usable on pinned Bun |

## 3. Tools

### 3.1 tstyche (primary)

- **Source:** https://tstyche.org/ ; https://github.com/tstyche/tstyche ; https://www.npmjs.com/package/tstyche
- **How it works [source]:** Install with `npm add -D tstyche`; the docs list `pnpm` and `yarn` but not Bun (https://tstyche.org/get-started/first-steps). It "loads the locally installed TypeScript" by default. Test files use `*.tst.*` naming, by convention.
- **Equality [source + ran]:** `.toBe()` checks that "the source type is the same as the target type" (https://tstyche.org/reference/expect-api). The docs say types are compared structurally. Phantom parameters are invisible to it [ran].
- **Negative tests [source + ran]:** `.not` negates a matcher (https://tstyche.org/reference/expect-api). `.toRaiseError()` is deprecated. Use `@ts-expect-error` with a message fragment. A bare `// @ts-expect-error` fails with "Directive requires an argument" [ran]. The directive has to match a message fragment, which reduces false passes from unrelated errors.
- **Overloads and generics [source]:** The docs list `.toBeCallableWith()`, `.toBeConstructableWith()`, and `.toAcceptProps()` (https://tstyche.org/reference/expect-api). Overload behavior was not tested.
- **Versions [source]:** "Currently TypeScript `>=5.4` can be used for testing." "TypeScript 7 is not yet supported by TSTyche" (https://tstyche.org/guides/typescript-versions). Repo's 5.8.3 is in range.
- **Dependencies [npm]:** No runtime dependencies. Peer `typescript`. Engines `node >=22` (https://registry.npmjs.org/tstyche).
- **License [npm]:** MIT.

Example, run in a scratch directory [ran]:

```ts
import { describe, expect, test } from 'tstyche';
import { ok, err, Result } from '../../src/Result';

describe('Result.combine', () => {
  test('mixed Ok/Err tuple returns exact Result', () => {
    const mixed = Result.combine([ok(1), err('boom' as const)] as const);
    expect(mixed).type.toBe<Result<readonly [number, never], 'boom'>>();
    expect(mixed).type.not.toBe<Result<readonly [number, never], 'other'>>();
  });

  test('promise entry returns Promise<Result>', () => {
    const p = Result.combine([ok(1), Promise.resolve(err('boom' as const))] as const);
    expect(p).type.toBe<Promise<Result<readonly [number, never], 'boom'>>>();
  });

  test('wrong value is rejected', () => {
    // @ts-expect-error Type 'Ok<string, never>' is not assignable
    const bad: Result<number, string> = ok('x');
    expect(bad).type.toBe<Result<number, string>>();
  });
});
```

Failure output for a wrong expectation [ran] (`bun x tstyche`, exit code 1):

```
Error: Type 'Result<readonly [number, never], "boom">' is not the same as type 'Result<readonly [number, string], "boom">'.
  6 |     expect(mixed).type.toBe<Result<readonly [number, string], 'boom'>>();
  at ./bad.tst.ts:6:29
```

With `// @ts-expect-error` and no fragment, the run failed with "Directive requires an argument" [ran].

### 3.2 expect-type (fallback)

- **Source:** https://github.com/mmkal/expect-type ; https://www.npmjs.com/package/expect-type ; source at https://raw.githubusercontent.com/mmkal/expect-type/main/src/utils.ts
- **How it works [source]:** Install with `npm install expect-type --save-dev`. "The README says failures 'will appear in your IDE and when you run `tsc`'" and it needs no CLI or build step. Expected failures use `// @ts-expect-error`.
- **Equality [source]:** `.toEqualTypeOf` is built on `StrictEqualUsingTSInternalIdenticalToOperator`: `(<T>() => T extends (L & T) | T ? true : false) extends <T>() => T extends (R & T) | T ? true : false`, with a `never` check. It is the same identity trick as type-challenges' `Equal`, so it should share the phantom blind spot (inference, not run).
- **Limitations [source]:** Intersections can fail when types are not identically defined. `toBeCallableWith` may fail with generic functions or overloads. `.branded` has a performance cost.
- **License [npm]:** Apache-2.0. npm lists no dependencies.

Example [not run]:

```ts
import { expectTypeOf } from 'expect-type';
import { ok, err, Result } from '../src/Result';

const mixed = Result.combine([ok(1), err('boom' as const)] as const);
expectTypeOf(mixed).toEqualTypeOf<Result<readonly [number, never], 'boom'>>();
expectTypeOf(mixed).not.toEqualTypeOf<Result<readonly [number, never], 'other'>>();
```

Run with `bun x tsc --noEmit`. This type-checks test files only if they are included in `tsconfig.json`. The repo's `include` is `["src"]`.

### 3.3 Vitest typecheck

- **Source:** https://vitest.dev/guide/testing-types ; https://vitest.dev/api/expect-typeof
- **How it works [source]:** "Vitest calls `tsc` or `vue-tsc`... and parses results." Files matching `*.test-d.ts` are type tests by default; `typecheck.include` changes that. Enable with `vitest --typecheck` (or a `package.json` script).
- **Equality and negation [source]:** `expectTypeOf` is a no-op at runtime. `toEqualTypeOf` "will check if the types are fully equal to each other." `.not` negates. `assertType` with `@ts-expect-error` is the documented negative pattern.
- **Caveat [source]:** "Because `@ts-expect-error` passes whenever an error exists, a typo can cause a false positive."
- **Dependencies [npm]:** Full `vitest` 5.1.0, MIT. Engines `node ^22.12.0 || ^24.0.0 || >=26.0.0`.
- **Bun [unverified]:** Not tested.

Use this only if the project adopts Vitest for runtime tests. Otherwise it adds a large dependency for one feature.

### 3.4 tsd

- **Source:** https://github.com/tsdjs/tsd ; releases https://github.com/tsdjs/tsd/releases ; package.json https://raw.githubusercontent.com/tsdjs/tsd/main/package.json
- **How it works [source]:** Run `npx tsd`. "These `.test-d.ts` files will not be executed, and not even compiled in the standard way."
- **API [source]:** `expectType<T>(expr)` (identical), `expectNotType`, `expectAssignable`, `expectNotAssignable`, `expectError`.
- **Maintenance [source + npm]:** Latest release v0.33.0 (npm publish 2025-08-05). The release notes say "Update to TypeScript 5.9". The `main` `package.json` lists `typescript ~4.9.5` as a devDependency, which does not match the release notes.
- **License:** MIT. Engines `node >=14.16`.

A reasonable choice, but the project is stale. I did not check how tsd compares identity internally.

### 3.5 type-challenges `Equal` / `Expect` (pattern)

- **Source:** https://github.com/type-challenges/type-challenges ; definitions at https://raw.githubusercontent.com/type-challenges/type-challenges/main/utils/index.d.ts
- **Definition [source]:**

```ts
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
export type Expect<T extends true> = T
```

- **Use [ran]:** With plain `tsc`, `Expect<Equal<...>>` catches wrong return types. `any` and `unknown` are distinct. `never` and `undefined` are distinct. `Equal<never, never>` is `true`. The phantom false pass above also applies.
- **Dependencies:** None if copied inline. The `@type-challenges/utils` package was last published 2020-09-07 [npm].

### 3.6 eslint-plugin-expect-type (avoid)

- **Source:** https://github.com/JoshuaKGoldberg/eslint-plugin-expect-type
- **[source]:** Adds `$ExpectType`, `$ExpectError`, `$ExpectTypeSnapshot`, and `^?` assertions. Requires TypeScript and `@typescript-eslint/parser`. Its rule `expect` needs type information. Licence Apache-2.0. npm publish 2026-09-19.
- **Why avoid:** It needs ESLint. The repo lints with Biome, and your editor uses oxc, so neither runs ESLint.

### 3.7 dtslint (avoid)

- **Source:** https://github.com/microsoft/DefinitelyTyped-tools/blob/main/packages/dtslint/README.md (reached through https://aka.ms/type-testing-tools)
- **[source]:** Under "Just looking for a type testing tool?", the README recommends `tsd`, `eslint-plugin-expect-type`, and `tstyche`. npm deprecates `dtslint` with "See https://aka.ms/type-testing-tools".

### 3.8 @ark/attest (avoid)

- **Source:** https://arktype.io/docs/attest ; https://www.npmjs.com/package/@ark/attest
- **[source]:** "Attest is a testing library that makes your TypeScript types available at runtime." Setup is required: call `setup` and `cleanup` in a Vitest `globalSetup` or Mocha hook. "This package is still in alpha!" Bun support is "pending" on a dependency.
- **Equality:** The docs do not describe how equality is checked.

### 3.9 conditional-type-checks and ts-toolbelt (avoid)

- `conditional-type-checks` 1.0.6, MIT, published 2022-06-18 [npm]. It provides `IsExact`, `AssertTrue`, `AssertFalse`, `IsNever` [source: https://github.com/dsherret/conditional-type-checks]. The README says nothing about limitations.
- `ts-toolbelt` 9.6.0, Apache-2.0, published 2021-03-10 [npm]. Its compatibility table lists `^4.1.x` for TypeScript [source: https://github.com/millsp/ts-toolbelt]. Only `Test.Pass` is documented.

### 3.10 `bun test`, `bun check`, `bun test --check`

- **`bun test` does not type-check [source + inference]:** Bun's docs say `expectTypeOf` "are no-ops at runtime" and tell you to run "`bun check` or `bun test --check` to verify the type assertions" (https://bun.com/docs/test/writing-tests). Plain `bun test` therefore does not verify types.
- **`bun check` [source]:** "It reads your `tsconfig.json`, reports the same errors as `tsc`..." (https://bun.com/docs/runtime/check). It is a port of typescript-go, and "You don't need the `typescript` package installed" (https://bun.com/blog/bun-v1.4.3).
- **Version [source + ran]:** Added in Bun 1.4.3, released 2026-10-10 (https://bun.com/blog/bun-v1.4.3). Local Bun 1.3.14: `bun check --help` fails [ran].
- **Recommendation:** Revisit after the repo upgrades to Bun 1.4.3+. Even then it checks with TypeScript 7 semantics, not 5.8.3.

### 3.11 Other things checked

- **TypeScript 7:** npm `latest` is `7.0.2` (2026-07-08). tstyche does not support TS 7 yet, so the repo stays on 5.8.3 for now.
- **Overloads [ran]:** `ReturnType` of an overloaded function uses the last overload. `declare function f(x: string): 1; declare function f(x: number): 2;` gives `ReturnType<typeof f>` = `2`.
- **Unused directive [ran]:** `// @ts-expect-error` on a valid line fails with TS2578 "Unused '@ts-expect-error' directive." This catches a stale negative test.
- **Typo false pass [ran]:** `// @ts-expect-error` above `ok(1 as number as Stringg)` was silent, so a typo in a negative test passes. tstyche's fragment rule avoids this.

## 4. Claims I could not verify

- Whether `bun test` ignores `*.tst.ts` in general. Only the default pattern shown in Bun's output was checked.
- Whether tstyche's `--tsconfig` selects files only from its `include`. In my run, root-level `*.tst.ts` files were still collected [ran]. Use `--listFiles` in the repo before relying on a separate tsconfig.
- Whether tstyche's `--target` downloads other TypeScript versions. The CLI has a `--fetch` flag [ran: `--help`]. Do not use it in CI without checking.
- Whether the repo's `tsdown` build would emit declarations for test files placed under `src/`. Not tested. Keep tests outside `src/`.
- Whether Vitest typecheck runs under `bun` (`bun x vitest --typecheck`). Not tested.
- Whether `bun test --check` works on Bun 1.3.x. On 1.3.14 the flag was accepted, but there were no tests to run, so the result was inconclusive [ran].
- Whether expect-type, tsd, or conditional-type-checks treat the phantom parameters the same way as tstyche and raw `tsc`. Only the identity operator in expect-type's source was read [source]. Its behavior was not run.
- Whether tsd's `expectType` uses the same identity check as tstyche's `toBe`. The README calls it "identical" but gives no algorithm.
- Whether the `Ok` / `Err` phantom issue exists in tstyche's `.toBeAssignableTo` (not tested).
- Whether `@type-challenges` and `ts-toolbelt` licences allow copying their definitions. `@type-challenges/utils` is MIT on npm. The type-challenges repository's own licence was not checked.
- Whether `dtslint` or `@ark/attest` would work with this repo. Not tested; excluded based on their published status.
- Bun support for `@ark/attest`. The docs say it is "pending"; the exact dependency was not checked.
- Whether Bun 1.3.8 (the pinned version) behaves like the locally run 1.3.14. Only 1.3.14 was tested.
