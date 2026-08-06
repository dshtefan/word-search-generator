import { createInitialState } from './initial-state'
import {
  cloneSavedGeneration,
  cloneSnapshotValue,
} from '@/features/saved-generations/snapshot'
import type {
  AppearanceSettings,
  AppearanceSettingsPatch,
  Dimensions,
  GenerationSettings,
  OutputSettings,
  OutputSettingsPatch,
  WordSearchAction,
  WordSearchSettings,
  WordSearchState,
} from './types'

function definedPatch<T extends object>(patch: Partial<T>): Partial<T> {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}

function patchGeneration(
  settings: GenerationSettings,
  patch: Partial<GenerationSettings>,
): GenerationSettings {
  const clampPercentage = (value: number | undefined, current: number) => {
    if (value === undefined) return current
    if (!Number.isFinite(value)) return 0
    return Math.min(100, Math.max(0, value))
  }

  return {
    ...settings,
    ...definedPatch(patch),
    words: patch.words === undefined ? settings.words : [...patch.words],
    cardinalDirections: patch.cardinalDirections === undefined
      ? settings.cardinalDirections
      : [...patch.cardinalDirections],
    diagonalDirections: patch.diagonalDirections === undefined
      ? settings.diagonalDirections
      : [...patch.diagonalDirections],
    crossingPreference: clampPercentage(
      patch.crossingPreference,
      settings.crossingPreference,
    ),
    spreadStrength: clampPercentage(patch.spreadStrength, settings.spreadStrength),
  }
}

function patchAppearance(
  settings: AppearanceSettings,
  patch: AppearanceSettingsPatch,
): AppearanceSettings {
  return {
    ...settings,
    ...definedPatch(patch),
    customFont: patch.customFont === undefined
      ? settings.customFont
      : { ...settings.customFont, ...definedPatch(patch.customFont) },
    localFont: patch.localFont === undefined
      ? settings.localFont
      : { ...settings.localFont, ...definedPatch(patch.localFont) },
  }
}

function patchOutput(
  settings: OutputSettings,
  patch: OutputSettingsPatch,
): OutputSettings {
  return {
    ...settings,
    ...definedPatch(patch),
    resolution: patch.resolution === undefined
      ? settings.resolution
      : patchDimensions(settings.resolution, patch.resolution),
    aspectRatio: patch.aspectRatio === undefined
      ? settings.aspectRatio
      : patchDimensions(settings.aspectRatio, patch.aspectRatio),
  }
}

function patchDimensions(
  dimensions: Dimensions,
  patch: Partial<Dimensions>,
): Dimensions {
  const clamp = (value: number | undefined, current: number) => {
    if (value === undefined) return current
    return Number.isFinite(value) && value > 0 ? value : 1
  }

  return {
    width: clamp(patch.width, dimensions.width),
    height: clamp(patch.height, dimensions.height),
  }
}

function copySettings(settings: WordSearchSettings): WordSearchSettings {
  return {
    generation: {
      ...settings.generation,
      words: [...settings.generation.words],
      cardinalDirections: [...settings.generation.cardinalDirections],
      diagonalDirections: [...settings.generation.diagonalDirections],
    },
    appearance: {
      ...settings.appearance,
      customFont: { ...settings.appearance.customFont },
      localFont: { ...settings.appearance.localFont },
    },
    output: {
      ...settings.output,
      resolution: { ...settings.output.resolution },
      aspectRatio: { ...settings.output.aspectRatio },
    },
  }
}

/** Applies one immutable, atomic transition to the complete word-search state. */
export function wordSearchReducer(
  state: WordSearchState,
  action: WordSearchAction,
): WordSearchState {
  switch (action.type) {
    case 'generation/changed':
      return {
        ...state,
        settings: {
          ...state.settings,
          generation: patchGeneration(state.settings.generation, action.payload),
        },
        current: null,
        status: 'idle',
        error: null,
      }
    case 'appearance/changed':
      return {
        ...state,
        settings: {
          ...state.settings,
          appearance: patchAppearance(state.settings.appearance, action.payload),
        },
      }
    case 'output/changed':
      return {
        ...state,
        settings: {
          ...state.settings,
          output: patchOutput(state.settings.output, action.payload),
        },
      }
    case 'output/modeChanged':
      return {
        ...state,
        settings: {
          ...state.settings,
          output: { ...state.settings.output, mode: action.payload },
        },
      }
    case 'generation/started':
      return { ...state, status: 'generating', error: null }
    case 'generation/succeeded':
      return { ...state, current: action.payload, status: 'ready', error: null }
    case 'generation/failed':
      return { ...state, current: null, status: 'error', error: action.payload }
    case 'saved/added':
      return {
        ...state,
        savedGenerations: [
          ...state.savedGenerations,
          cloneSavedGeneration(action.payload),
        ],
      }
    case 'saved/removed':
      return {
        ...state,
        savedGenerations: state.savedGenerations.filter(({ id }) => id !== action.payload),
      }
    case 'saved/applied':
      return {
        ...state,
        settings: copySettings(action.payload.settings),
        current: cloneSnapshotValue(action.payload.result),
        status: 'ready',
        error: null,
      }
    case 'reset':
      return {
        ...createInitialState(),
        savedGenerations: state.savedGenerations.map(cloneSavedGeneration),
      }
  }
}
