import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import type { ReactNode } from 'react'
import { runGeneration } from '@/features/generator/run-generation'
import { createSavedGeneration } from '@/features/saved-generations/snapshot'
import { createInitialState } from './initial-state'
import { wordSearchReducer } from './reducer'
import {
  WordSearchContext,
  type WordSearchCommands,
  type WordSearchContextValue,
} from './word-search-context'
import {
  defaultWordSearchRuntime,
  type WordSearchRuntime,
} from './word-search-runtime'

/** Props for the application-level word-search provider. */
export interface WordSearchProviderProps {
  readonly children: ReactNode
  readonly runtime?: WordSearchRuntime
}

/** Owns repository initialization and exposes atomic intent-level UI commands. */
export function WordSearchProvider({
  children,
  runtime = defaultWordSearchRuntime,
}: WordSearchProviderProps) {
  const [state, dispatch] = useReducer(
    wordSearchReducer,
    runtime.initialState,
  )
  const clearedPreferenceSnapshot = useRef<string | null>(null)

  useEffect(() => {
    if (clearedPreferenceSnapshot.current !== null) {
      const clearedSnapshot = clearedPreferenceSnapshot.current
      clearedPreferenceSnapshot.current = null
      if (JSON.stringify(state.settings) === clearedSnapshot) return
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
      dispatch({ type: 'generation/failed', payload: outcome.code })
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
    const defaultSettings = createInitialState().settings
    runtime.preferences.clear()
    clearedPreferenceSnapshot.current = JSON.stringify(defaultSettings)
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
