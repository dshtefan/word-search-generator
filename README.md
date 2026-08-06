# Word Search Generator

Create customizable word-search puzzles, save generated snapshots, and export
puzzles or answer keys as SVG, PNG, or PDF.

## Requirements

Use Node.js `v24.19.0` (the version in [`.nvmrc`](.nvmrc)) and npm.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite development server. Build a production bundle
with `npm run build`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Type-check with TypeScript and build with Vite. |
| `npm run lint` | Run ESLint across the project. |
| `npm test` | Run the Jest test suite. |
| `npm run test:watch` | Run Jest in watch mode. |
| `npm run test:coverage` | Run Jest with coverage thresholds. |
| `npm run preview` | Start Vite's local production-bundle preview. |

## Using the generator

1. Enter words, choose one of the supported languages (English, Russian, or
   German), select directions, and set grid dimensions.
2. Generate a puzzle. Changing generation inputs clears the current result;
   appearance and output settings do not regenerate it.
3. Adjust the grid, font, highlight, and output-size settings as needed.
4. Save a named generation to retain its settings and puzzle together. The app
   stores preferences and saved generations in browser storage.
5. Export the current puzzle or saved generations as SVG, PNG, or PDF. Current
   exports can include the puzzle, answer key, or both; multiple saved
   generations are packaged as a ZIP archive.

## Technology

The interface is built with React and TypeScript, bundled by Vite, styled with
Tailwind CSS, and tested with Jest plus React Testing Library. Export uses SVG
as the canonical document representation, with browser rasterization for PNG
and PDF output.

For contributor guidance, see [architecture documentation](docs/architecture.md)
and [testing documentation](docs/testing.md).
