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

export interface WordPlacement {
  index: number
  startX: number
  startY: number
  direction: Direction
  wordText: string
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
  localFontFullName: string
  localFontStyle: string
  placements: WordPlacement[]
  grid: Cell[][] | null
  solutionGrid: Cell[][] | null
  isGenerated: boolean
  isGenerating: boolean
  error: string | null
  useResolution: boolean
  resolutionW: number
  resolutionH: number
  useAspectRatio: boolean
  aspectRatioW: number
  aspectRatioH: number
}

export interface SavedGeneration {
  id: string
  name: string
  grid: Cell[][] | null
  solutionGrid: Cell[][] | null
  placements: WordPlacement[]
  words: string[]
  fontFamily: string
  fontSize: number
  highlightColor: string
  gridStyle: GridStyle
  useCustomFont: boolean
  customFontUrl: string
  useLocalFont: boolean
  localFontFamily: string
  localFontFullName: string
  localFontStyle: string
  useResolution: boolean
  resolutionW: number
  resolutionH: number
  useAspectRatio: boolean
  aspectRatioW: number
  aspectRatioH: number
  createdAt: number
}
