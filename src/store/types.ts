import type {
  Direction,
  GridStyle,
  Language,
  WordSearchResult,
} from '@/domain/word-search'
import type { SavedGeneration } from '@/features/saved-generations/types'

/** Selects natural sizing or exactly one constrained output sizing strategy. */
export type OutputMode = 'natural' | 'resolution' | 'aspect-ratio'

/** Inputs whose changes require a new puzzle to be generated. */
export interface GenerationSettings {
  words: string[]
  language: Language
  width: number
  height: number
  cardinalDirections: Direction[]
  diagonalDirections: Direction[]
}

/** Describes an optional web-hosted custom font. */
export interface FontSourceSettings {
  enabled: boolean
  url: string
}

/** Identifies an optional font selected from the user's local system. */
export interface LocalFontSettings {
  enabled: boolean
  family: string
  fullName: string
  style: string
}

/** Rendering choices that can be changed without regenerating the puzzle. */
export interface AppearanceSettings {
  highlightColor: string
  fontFamily: string
  fontSize: number
  gridStyle: GridStyle
  customFont: FontSourceSettings
  localFont: LocalFontSettings
}

/** A two-dimensional width and height value. */
export interface Dimensions {
  width: number
  height: number
}

/** Output sizing preferences; `mode` is the single source of mutual exclusion. */
export interface OutputSettings {
  mode: OutputMode
  resolution: Dimensions
  aspectRatio: Dimensions
}

/** Groups generation inputs separately from settings that only affect rendering. */
export interface WordSearchSettings {
  generation: GenerationSettings
  appearance: AppearanceSettings
  output: OutputSettings
}

/** Complete application state for generation, rendering, and saved snapshots. */
export interface WordSearchState {
  settings: WordSearchSettings
  current: WordSearchResult | null
  status: 'idle' | 'generating' | 'ready' | 'error'
  error: string | null
  savedGenerations: SavedGeneration[]
}

/** Deep appearance patch in which omitted or `undefined` members remain unchanged. */
export type AppearanceSettingsPatch =
  Omit<Partial<AppearanceSettings>, 'customFont' | 'localFont'> & {
    customFont?: Partial<FontSourceSettings>
    localFont?: Partial<LocalFontSettings>
  }

/** Deep output patch in which omitted or `undefined` dimensions remain unchanged. */
export type OutputSettingsPatch =
  Omit<Partial<OutputSettings>, 'resolution' | 'aspectRatio'> & {
    resolution?: Partial<Dimensions>
    aspectRatio?: Partial<Dimensions>
  }

/** All reducer events are complete user intents rather than field-level mutations. */
export type WordSearchAction =
  | { type: 'generation/changed'; payload: Partial<GenerationSettings> }
  | { type: 'appearance/changed'; payload: AppearanceSettingsPatch }
  | { type: 'output/changed'; payload: OutputSettingsPatch }
  | { type: 'output/modeChanged'; payload: OutputMode }
  | { type: 'generation/started' }
  | { type: 'generation/succeeded'; payload: WordSearchResult }
  | { type: 'generation/failed'; payload: string }
  | { type: 'saved/added'; payload: SavedGeneration }
  | { type: 'saved/removed'; payload: string }
  | { type: 'saved/applied'; payload: SavedGeneration }
  | { type: 'reset' }
