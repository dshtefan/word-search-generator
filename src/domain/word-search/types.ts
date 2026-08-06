export type Direction =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right'

export type Language = 'en' | 'ru' | 'de'

/** Draws every cell (`full`), only the perimeter (`outer`), or no borders (`none`). */
export type GridStyle = 'full' | 'outer' | 'none'

export interface Point {
  readonly x: number
  readonly y: number
}

export interface Cell {
  readonly letter: string
}

export type Grid = readonly (readonly Cell[])[]

/** A word's fixed position and reading direction within a generated grid. */
export interface WordPlacement extends Point {
  readonly wordIndex: number
  readonly direction: Direction
  readonly word: string
}

/** Immutable input used by the word-search generator. */
export interface GenerationInput {
  readonly words: readonly string[]
  readonly directions: readonly Direction[]
  readonly width: number
  readonly height: number
  readonly language: Language
}

/** The printable puzzle, its solution, and the locations of all placed words. */
export interface WordSearchResult {
  readonly puzzle: Grid
  readonly solution: Grid
  readonly placements: readonly WordPlacement[]
}

/** Supplies a pseudo-random value in the range expected by generator algorithms. */
export type RandomSource = () => number
