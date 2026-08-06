# AGENTS.md

## Project map

- `src/domain/word-search`: pure word-search model, normalization, validation,
  directions, letters, and generation; import its public API through `index.ts`.
- `src/features/generator`: domain-to-UI generation outcome adapter.
- `src/features/saved-generations`: snapshot cloning and strict versioned
  persistence.
- `src/features/export`: export-document construction, SVG rendering,
  raster/PDF adapters, downloading, and ZIP packaging.
- `src/store`: state types, reducer, persistence runtime, provider, and
  `useWordSearch` intent facade.
- `src/i18n`: typed `en`, `ru`, and `de` interface messages, locale context,
  and locale persistence separate from puzzle settings.
- `src/components`: UI sections and primitives; `src/app/App.tsx` composes the
  application. `src/shared` holds cross-cutting helpers, `src/lib/utils.ts`
  holds general UI utilities, `src/main.tsx` mounts `<App />` in `StrictMode`,
  `src/index.css` supplies global styles, and `src/test` holds test setup and
  provider-aware render helpers.

## Dependency rules

- Keep `src/domain/word-search` pure: no React, browser APIs, store,
  components, or feature imports.
- Features may use the domain and required store/snapshot types. The store may
  compose domain and features. Components may consume the store facade, domain
  and feature types/helpers, shared helpers, and `src/lib` utilities; those
  inward layers must not depend on components. Prefer intent-level store
  commands for state changes, and do not duplicate domain, persistence, or
  export logic.
- Export document construction and SVG rendering are pure. Exports consume
  snapshots/domain data and injected ports; never scrape a rendered table or
  any other live DOM output.
- Use the `@/` alias for `src` imports and keep public/non-obvious contracts
  documented with concise TSDoc. Do not narrate straightforward internals.
- Route every user-visible label, description, accessibility name, and
  presentation-safe error through `useI18n()`. Pass stable error codes from
  features to components instead of localized strings.

## Commands

Use Node `v24.19.0` from `.nvmrc`.

```bash
npm run dev
npm test -- --runInBand
npm run test:coverage -- --runInBand
npm run lint
npm run build
```

## Change policy

- Work test-first: add a focused failing regression test, implement the
  smallest fix, run focused and full tests, then refactor while green. Inject
  randomness, time, IDs, storage, and export ports in tests for determinism.
- Preserve existing visible controls, labels, order, tabs, and SVG/PNG/PDF
  export formats unless a task explicitly authorizes a UI change.
- Persisted preferences and saved generations use strict `{ version: 2, data }`
  envelopes, with an explicit version-1-to-version-2 migration for generation
  balance defaults. Keep validation and safe fallback behavior; introduce an
  explicit migration before changing a stored shape or version again.
- Do not add dependencies unless the task requires them. Prefer existing
  domain contracts, feature ports, and UI primitives.
