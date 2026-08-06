# Architecture

## Source map and dependency rules

The table lists internal project imports. Package imports such as `react` and
`react-dom/client` are intentionally outside this project-layer direction map.

| Directory | Responsibility | May depend on |
| --- | --- | --- |
| `src/domain/word-search` | Pure types, normalization, validation, placement, and generation. Its public API is `index.ts`. | Other files in this domain only. |
| `src/features/generator` | Converts domain failures into UI-safe generation outcomes. | Domain and store types. |
| `src/features/saved-generations` | Immutable saved snapshots and strict browser-storage repository. | Domain and store types. |
| `src/features/export` | Export-document construction, pure SVG rendering, raster/PDF adapters, downloading, and ZIP packaging. | Domain, saved-generation types, store types, and shared font parsing. |
| `src/store` | Application state, reducer, persistence runtime, React provider, and intent-level context facade. | Domain and features. |
| `src/components` | Presentational/editor UI and UI primitives. | The store facade plus inward domain/feature types and helpers, shared helpers, `src/lib`, and component-local modules; none of those layers may depend on components. |
| `src/shared` | Small cross-cutting helpers that do not belong to a feature. | Domain-independent utilities only. |
| `src/lib` | General UI utility helpers such as `cn`. | Third-party utility packages only. |
| `src/app` | Top-level composition of the provider and UI sections. | Components and store. |
| `src/main.tsx` | React entry point that mounts the application. | App and global styles. |
| `src/index.css` | Global Tailwind and application styles. | CSS imports only. |
| `src/test` | Jest setup and provider-aware rendering helpers. | Application modules and test libraries. |

Keep dependencies flowing toward the domain and feature contracts: the domain
must not import React, browser APIs, the store, components, or features. The
export document builder and SVG renderer must remain independent of React and
the live DOM. Components may read domain/feature types and helpers where they
render or configure a supported contract, but state changes should prefer the
intent-level `useWordSearch()` commands. Use `@/` for imports rooted at `src`.

## Generation and state flow

`WordSearchProvider` exposes `useWordSearch()` to components. Its commands are
`updateGeneration`, `updateAppearance`, `updateOutput`, `generate`,
`saveGeneration`, `removeSaved`, `applySaved`, and `reset`.

Generation changes dispatch `generation/changed`, which clears the current
puzzle. `generate` dispatches `generation/started`, invokes
`runGeneration(settings.generation, { random })`, and dispatches either
`generation/succeeded` or `generation/failed`. The generator calls the domain
`generateWordSearch` with normalized input, selected cardinal and diagonal
directions, generation-balance weights, and an injectable `RandomSource`.
Candidate placement uses soft scoring: `crossingPreference` rewards compatible
partial overlaps, while `spreadStrength` penalizes occupied neighboring cells.
Both values are percentages, so neither setting makes an otherwise valid
placement illegal. Only overlaps formed by non-collinear directions receive a
crossing reward; same-line overlaps receive a strong readability penalty and
remain available solely as a placement fallback.

`WordSearchState` groups:

- `settings.generation`: words, language, dimensions, direction lists, crossing
  preference, and spread strength.
- `settings.appearance`: highlight, fonts, and grid style.
- `settings.output`: natural, resolution, or aspect-ratio dimensions.
- `current`, `status`, `error`, and `savedGenerations`.

Reducer actions are complete user intents: `generation/changed`,
`appearance/changed`, `output/changed`, `output/modeChanged`,
`generation/started`, `generation/succeeded`, `generation/failed`,
`saved/added`, `saved/removed`, `saved/applied`, and `reset`. Preserve their
immutable updates and invalidation behavior when adding settings.

## Persistence

The runtime loads repositories before React renders and persists changes from
the provider. Preferences use the `word-search:preferences` key; saved
snapshots use `word-search:saved-generations`. Both store this versioned
envelope:

```json
{ "version": 2, "data": "validated payload" }
```

Repositories migrate valid version-1 payloads by adding neutral 50/50
generation-balance defaults, then strictly validate the complete version-2
shape. Missing, malformed,
unsupported-version, or inaccessible storage recovers to fresh defaults for
preferences and an empty list for saved generations. A saved generation holds
an id, name, timestamp, settings, and `WordSearchResult`; snapshots are cloned
at save, reducer, and restore boundaries.

## Export flow and ports

`createExportDocument(source, { answers })` converts a saved snapshot into
renderer-independent cells, answer paths, dimensions, font data, and grid
style. `renderSvg(document)` serializes that document without reading browser
rendering state. `createExportService()` then chooses the `svg`, `png`, or
`pdf` adapter and returns an `ExportResult`.

External effects are behind injectable ports:

- `RasterizeSvg` rasterizes serialized SVG for PNG and PDF adapters.
- `ExportBinaryAdapter` converts a document to a PNG or PDF `Blob`.
- `BlobDownloadPort` emits a named blob.
- `ZipPackagingPort` packages named saved-generation exports.

The default adapters use canvas/image APIs for rasterization, jsPDF for PDF,
and JSZip for batch archives. Export code must consume the snapshot/domain data
and these ports; it must never scrape a rendered table or other live DOM output.

## Extending the app

### Add a language

1. Add the language literal to `Language` in `src/domain/word-search/types.ts`.
2. Add its weighted alphabet in `src/domain/word-search/letters.ts` and ensure
   word normalization supports it in `normalize.ts`.
3. Add it to the persistence repository's allowed language set and expose it in
   the language UI.
4. Add deterministic domain, repository, and UI tests as applicable.

### Add an export format

1. Extend `ExportFormat` in `src/features/export/types.ts`.
2. Implement an `ExportBinaryAdapter` (or direct serialized-blob branch) from
   `ExportDocument`; do not read rendered DOM output.
3. Add the service branch in `createExportService`, UI selection support, and
   filename behavior.
4. Cover the adapter through injected ports and the export-service tests.
