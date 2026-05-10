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

export type GridStyle = 'full' | 'outer' | 'none'

export interface Cell {
  letter: string
  isPartOfWord: boolean
  wordIndex: number | null
}

export interface WordSearchState {
  words: string[]
  language: Language
  gridX: number
  gridY: number
  highlightColor: string
  cardinalDirections: Direction[]
  diagonalDirections: Direction[]
  fontFamily: string
  fontSize: number
  gridStyle: GridStyle
  useCustomFont: boolean
  customFontUrl: string
  useLocalFont: boolean
  localFontFamily: string
  grid: Cell[][] | null
  solutionGrid: Cell[][] | null
  isGenerated: boolean
  isGenerating: boolean
  error: string | null
}
