import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { RandomSource } from '@/domain/word-search'
import { createExportService } from '@/features/export/export-service'
import { runGeneration } from '@/features/generator/run-generation'
import {
  createSavedGenerationsRepository,
  type StorageAdapter,
} from '@/features/saved-generations/repository'
import { createSavedGeneration } from '@/features/saved-generations/snapshot'
import { createInitialState } from './initial-state'
import { createPreferencesRepository } from './preferences-repository'
import { wordSearchReducer } from './reducer'
import type { WordSearchSettings, WordSearchState } from './types'

type ExportService = ReturnType<typeof createExportService>

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
  readonly exportService: ExportService
}

/** Injectable external boundaries used to make the provider deterministic in tests. */
export interface WordSearchProviderDependencies {
  readonly storage?: StorageAdapter
  readonly random?: RandomSource
  readonly createId?: () => string
  readonly now?: () => number
  readonly exportService?: ExportService
}

/** Props for the application-level word-search provider. */
export interface WordSearchProviderProps {
  readonly children: ReactNode
  readonly dependencies?: WordSearchProviderDependencies
}

interface ProviderRuntime {
  readonly preferences: ReturnType<typeof createPreferencesRepository>
  readonly savedGenerations: ReturnType<typeof createSavedGenerationsRepository>
  readonly random: RandomSource
  readonly createId: () => string
  readonly now: () => number
  readonly exportService: ExportService
}

const WordSearchContext = createContext<WordSearchContextValue | null>(null)

function getBrowserStorage(): StorageAdapter {
  return window.localStorage
}

function createRuntime(
  dependencies: WordSearchProviderDependencies,
): ProviderRuntime {
  const storage = dependencies.storage ?? getBrowserStorage()
  return {
    preferences: createPreferencesRepository(storage),
    savedGenerations: createSavedGenerationsRepository(storage),
    random: dependencies.random ?? Math.random,
    createId: dependencies.createId ?? (() => crypto.randomUUID()),
    now: dependencies.now ?? Date.now,
    exportService: dependencies.exportService ?? createExportService(),
  }
}

/** Owns repository initialization and exposes atomic intent-level UI commands. */
export function WordSearchProvider({
  children,
  dependencies = {},
}: WordSearchProviderProps) {
  const [runtime] = useState(() => createRuntime(dependencies))
  const [state, dispatch] = useReducer(
    wordSearchReducer,
    undefined,
    (): WordSearchState => ({
      ...createInitialState(),
      settings: runtime.preferences.load(),
      savedGenerations: runtime.savedGenerations.load(),
    }),
  )
  const skipPreferencePersistence = useRef(false)

  useEffect(() => {
    if (skipPreferencePersistence.current) {
      skipPreferencePersistence.current = false
      return
    }
    runtime.preferences.save(state.settings)
  }, [runtime, state.settings])

  useEffect(() => {
    runtime.savedGenerations.save(state.savedGenerations)
  }, [runtime, state.savedGenerations])

  const updateGeneration = useCallback<WordSearchCommands['updateGeneration']>(
    (patch) => dispatch({ type: 'generation/changed', payload: patch }),
    [],
  )
  const updateAppearance = useCallback<WordSearchCommands['updateAppearance']>(
    (patch) => dispatch({ type: 'appearance/changed', payload: patch }),
    [],
  )
  const updateOutput = useCallback<WordSearchCommands['updateOutput']>(
    (patch) => dispatch({ type: 'output/changed', payload: patch }),
    [],
  )
  const generate = useCallback(() => {
    dispatch({ type: 'generation/started' })
    const outcome = runGeneration(state.settings.generation, {
      random: runtime.random,
    })
    if ('value' in outcome) {
      dispatch({ type: 'generation/succeeded', payload: outcome.value })
    } else {
      dispatch({ type: 'generation/failed', payload: outcome.message })
    }
  }, [runtime.random, state.settings.generation])
  const saveGeneration = useCallback((name: string) => {
    if (state.current === null) return
    dispatch({
      type: 'saved/added',
      payload: createSavedGeneration(state, name, {
        createId: runtime.createId,
        now: runtime.now,
      }),
    })
  }, [runtime.createId, runtime.now, state])
  const removeSaved = useCallback((id: string) => {
    dispatch({ type: 'saved/removed', payload: id })
  }, [])
  const applySaved = useCallback((id: string) => {
    const saved = state.savedGenerations.find((item) => item.id === id)
    if (saved !== undefined) {
      dispatch({ type: 'saved/applied', payload: saved })
    }
  }, [state.savedGenerations])
  const reset = useCallback(() => {
    runtime.preferences.clear()
    skipPreferencePersistence.current = true
    dispatch({ type: 'reset' })
  }, [runtime])

  const value = useMemo<WordSearchContextValue>(() => ({
    state,
    exportService: runtime.exportService,
    updateGeneration,
    updateAppearance,
    updateOutput,
    generate,
    saveGeneration,
    removeSaved,
    applySaved,
    reset,
  }), [
    applySaved,
    generate,
    removeSaved,
    reset,
    runtime.exportService,
    saveGeneration,
    state,
    updateAppearance,
    updateGeneration,
    updateOutput,
  ])

  return (
    <WordSearchContext.Provider value={value}>
      {children}
    </WordSearchContext.Provider>
  )
}

/** Returns the word-search facade for a descendant of `WordSearchProvider`. */
export function useWordSearch(): WordSearchContextValue {
  const context = useContext(WordSearchContext)
  if (context === null) {
    throw new Error('useWordSearch must be used within a WordSearchProvider')
  }
  return context
}
