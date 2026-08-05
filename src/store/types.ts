import type {
  Direction,
  GridStyle,
  Language,
  WordSearchResult,
} from '@/domain/word-search'
import type { SavedGeneration } from '@/features/saved-generations/types'

export type OutputMode = 'natural' | 'resolution' | 'aspect-ratio'

export interface GenerationSettings {
  words: string[]
  language: Language
  width: number
  height: number
  cardinalDirections: Direction[]
  diagonalDirections: Direction[]
}

export interface FontSourceSettings {
  enabled: boolean
  url: string
}

export interface LocalFontSettings {
  enabled: boolean
  family: string
  fullName: string
  style: string
}

export interface AppearanceSettings {
  highlightColor: string
  fontFamily: string
  fontSize: number
  gridStyle: GridStyle
  customFont: FontSourceSettings
  localFont: LocalFontSettings
}

export interface Dimensions {
  width: number
  height: number
}

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

export interface WordSearchState {
  settings: WordSearchSettings
  current: WordSearchResult | null
  status: 'idle' | 'generating' | 'ready' | 'error'
  error: string | null
  savedGenerations: SavedGeneration[]
}

export type AppearanceSettingsPatch =
  Omit<Partial<AppearanceSettings>, 'customFont' | 'localFont'> & {
    customFont?: Partial<FontSourceSettings>
    localFont?: Partial<LocalFontSettings>
  }

export type OutputSettingsPatch =
  Omit<Partial<OutputSettings>, 'mode' | 'resolution' | 'aspectRatio'> & {
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
