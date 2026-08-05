import type { WordSearchResult } from '@/domain/word-search'
import type { WordSearchSettings } from '@/store/types'

/** A named, immutable snapshot of the settings and generated puzzle saved together. */
export interface SavedGeneration {
  readonly id: string
  readonly name: string
  readonly createdAt: number
  readonly settings: WordSearchSettings
  readonly result: WordSearchResult
}
