import {
  generateWordSearch,
  WordSearchError,
} from '@/domain/word-search'
import type { GenerateWordSearchOptions, WordSearchErrorCode, WordSearchResult } from '@/domain/word-search'
import type { GenerationSettings } from '@/store'

/** A generated puzzle or a presentation-safe failure that retains its original cause. */
export type GenerationOutcome =
  | { ok: true; value: WordSearchResult }
  | { ok: false; code: WordSearchErrorCode | 'UNKNOWN'; cause: unknown }

/** Runs domain generation and converts thrown failures into a UI-safe outcome. */
export function runGeneration(
  settings: GenerationSettings,
  options?: GenerateWordSearchOptions,
): GenerationOutcome {
  try {
    const value = generateWordSearch({
      words: settings.words,
      directions: [
        ...settings.cardinalDirections,
        ...settings.diagonalDirections,
      ],
      width: settings.width,
      height: settings.height,
      language: settings.language,
    }, {
      ...options,
      crossingPreference: settings.crossingPreference,
      spreadStrength: settings.spreadStrength,
    })

    return { ok: true, value }
  } catch (cause: unknown) {
    return {
      ok: false,
      code: cause instanceof WordSearchError ? cause.code : 'UNKNOWN',
      cause,
    }
  }
}
