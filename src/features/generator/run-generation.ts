import {
  generateWordSearch,
  WordSearchError,
} from '@/domain/word-search'
import type {
  GenerateWordSearchOptions,
  WordSearchErrorCode,
  WordSearchResult,
} from '@/domain/word-search'
import type { GenerationSettings } from '@/store'

export type GenerationOutcome =
  | { ok: true; value: WordSearchResult }
  | { ok: false; message: string; cause: unknown }

const DOMAIN_ERROR_MESSAGES: Readonly<Record<WordSearchErrorCode, string>> = {
  NO_WORDS: 'At least one word is required',
  NO_DIRECTIONS: 'At least one direction must be selected',
  INVALID_DIMENSIONS: 'Grid dimensions must be positive integers',
  WORD_DOES_NOT_FIT: 'At least one word does not fit in the selected grid',
  PLACEMENT_EXHAUSTED: 'Could not place every word — try a larger grid or fewer words',
}

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
    }, options)

    return { ok: true, value }
  } catch (cause: unknown) {
    return {
      ok: false,
      message: cause instanceof WordSearchError
        ? DOMAIN_ERROR_MESSAGES[cause.code]
        : 'Unable to generate word search',
      cause,
    }
  }
}
