import type { RandomSource } from '@/domain/word-search'
import { createExportService } from '@/features/export/export-service'
import {
  createSavedGenerationsRepository,
  type StorageAdapter,
} from '@/features/saved-generations/repository'
import { createInitialState } from './initial-state'
import { createPreferencesRepository } from './preferences-repository'
import type { WordSearchState } from './types'

type ExportService = ReturnType<typeof createExportService>

/** Injectable external boundaries used to make the provider deterministic in tests. */
export interface WordSearchProviderDependencies {
  readonly storage?: StorageAdapter
  readonly random?: RandomSource
  readonly createId?: () => string
  readonly now?: () => number
  readonly exportService?: ExportService
}

/** Preloaded repositories and external ports consumed without render-time I/O. */
export interface WordSearchRuntime {
  readonly preferences: ReturnType<typeof createPreferencesRepository>
  readonly savedGenerations: ReturnType<typeof createSavedGenerationsRepository>
  readonly initialState: WordSearchState
  readonly random: RandomSource
  readonly createId: () => string
  readonly now: () => number
  readonly exportService: ExportService
}

function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

/** Acquires Web Storage without letting an access-control getter abort startup. */
function getBrowserStorage(): StorageAdapter {
  try {
    return typeof window === 'undefined'
      ? createMemoryStorage()
      : window.localStorage
  } catch {
    return createMemoryStorage()
  }
}

/** Creates and loads one provider runtime outside React's render lifecycle. */
export function createWordSearchRuntime(
  dependencies: WordSearchProviderDependencies,
): WordSearchRuntime {
  const storage = dependencies.storage ?? getBrowserStorage()
  const preferences = createPreferencesRepository(storage)
  const savedGenerations = createSavedGenerationsRepository(storage)
  return {
    preferences,
    savedGenerations,
    initialState: {
      ...createInitialState(),
      settings: preferences.load(),
      savedGenerations: savedGenerations.load(),
    },
    random: dependencies.random ?? Math.random,
    createId: dependencies.createId ?? (() => crypto.randomUUID()),
    now: dependencies.now ?? Date.now,
    exportService: dependencies.exportService ?? createExportService(),
  }
}

export const defaultWordSearchRuntime = createWordSearchRuntime({})
