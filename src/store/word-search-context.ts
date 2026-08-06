import { createContext, useContext } from 'react'
import type { WordSearchSettings, WordSearchState } from './types'
import type { WordSearchRuntime } from './word-search-runtime'

/** User intents exposed to React components by the word-search facade. */
export interface WordSearchCommands {
  /** Changes inputs that invalidate the current generated puzzle. */
  updateGeneration(patch: Partial<WordSearchSettings['generation']>): void
  /** Changes rendering preferences without regenerating the puzzle. */
  updateAppearance(patch: Partial<WordSearchSettings['appearance']>): void
  /** Changes mutually exclusive output sizing preferences. */
  updateOutput(patch: Partial<WordSearchSettings['output']>): void
  /** Generates a complete puzzle from the latest generation settings. */
  generate(): void
  /** Persists the current puzzle and all settings under a name. */
  saveGeneration(name: string): void
  /** Removes one saved snapshot by identifier. */
  removeSaved(id: string): void
  /** Restores one saved snapshot as a single state transition. */
  applySaved(id: string): void
  /** Restores default preferences while retaining saved snapshots. */
  reset(): void
}

/** Stable React context contract for state, commands, and browser export. */
export interface WordSearchContextValue extends WordSearchCommands {
  readonly state: WordSearchState
  readonly exportService: WordSearchRuntime['exportService']
}

export const WordSearchContext = createContext<WordSearchContextValue | null>(null)

/** Returns the word-search facade for a descendant of `WordSearchProvider`. */
export function useWordSearch(): WordSearchContextValue {
  const context = useContext(WordSearchContext)
  if (context === null) {
    throw new Error('useWordSearch must be used within a WordSearchProvider')
  }
  return context
}
