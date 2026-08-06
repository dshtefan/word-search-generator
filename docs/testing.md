# Testing

The project uses Jest with `ts-jest`, the jsdom environment, and React Testing
Library (RTL). Jest setup lives in `src/test/setup.ts`; provider-aware UI tests
use `renderWordSearch` from `src/test/render-app.tsx`.

## Commands

```bash
# One test file
npm test -- src/domain/word-search/generate.test.ts

# Full suite, serially
npm test -- --runInBand

# Full suite with coverage, serially
npm run test:coverage -- --runInBand

# Interactive watch mode
npm run test:watch
```

Tests live beside the module they cover as `*.test.ts` or `*.test.tsx`.
Domain, features, store, shared helpers, and components use this convention;
test infrastructure is in `src/test`.

## Determinism and test boundaries

The generator accepts `GenerateWordSearchOptions.random`, and the provider
runtime accepts `random`, `createId`, `now`, storage, and export-service
dependencies. Inject these ports in tests instead of depending on
`Math.random`, the clock, browser storage, or downloads. `renderWordSearch`
supplies deterministic defaults, including a random source that returns `0`.

Prefer RTL interactions and observable UI behavior for components. Test domain,
reducer, persistence, and export logic directly through their public functions
and injected adapters rather than implementation details or browser APIs.

## Coverage

Coverage is collected from `src/domain`, `src/features`, `src/store`, and
`src/shared`. It excludes test files, `src/test`, declaration files, and barrel
`index.ts` files. The global minimums are:

| Metric | Minimum |
| --- | ---: |
| Statements | 85% |
| Lines | 85% |
| Functions | 85% |
| Branches | 80% |

## Red-green-refactor

For a bug or behavior change, first add one focused regression test that fails
for the intended reason (red). Implement only what makes it pass (green), run
the focused test and full suite, then refactor only while the tests stay green.
Do not change production behavior before its failing test exists. Keep tests
behavioral, narrowly scoped, and deterministic; mocks are only for unavoidable
external ports.
