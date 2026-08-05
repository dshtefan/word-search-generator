import type { WordSearchState } from '@/store/types'
import type { SavedGeneration } from './types'

interface SnapshotDependencies {
  createId?: () => string
  now?: () => number
}

/** Creates an independent structured copy suitable for persisted snapshots. */
export function cloneSnapshotValue<T>(value: T): T {
  return structuredClone(value)
}

/** Copies a saved generation without retaining references to the source object. */
export function cloneSavedGeneration(saved: SavedGeneration): SavedGeneration {
  return cloneSnapshotValue(saved)
}

/** Captures the current puzzle and all settings as one immutable saved snapshot. */
export function createSavedGeneration(
  state: WordSearchState,
  name: string,
  dependencies: SnapshotDependencies = {},
): SavedGeneration {
  if (state.current === null) {
    throw new Error('Cannot save a generation without a current result')
  }

  const normalizedName = name.trim()

  return {
    id: (dependencies.createId ?? (() => crypto.randomUUID()))(),
    name: normalizedName || `Generation ${state.savedGenerations.length + 1}`,
    createdAt: (dependencies.now ?? Date.now)(),
    settings: cloneSnapshotValue(state.settings),
    result: cloneSnapshotValue(state.current),
  }
}
