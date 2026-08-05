import { DIRECTION_VECTORS } from './directions'
import { WordSearchError } from './errors'
import { normalizeWords } from './normalize'
import type { Direction, GenerationInput } from './types'

function isValidDimension(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 1
}

function fitsDirection(
  wordLength: number,
  direction: Direction,
  width: number,
  height: number,
): boolean {
  const vector = DIRECTION_VECTORS[direction]
  const steps = wordLength - 1
  return Math.abs(vector.x) * steps < width && Math.abs(vector.y) * steps < height
}

/** Validates generation rules and returns the normalized words that were checked. */
export function validateGenerationInput(input: GenerationInput): string[] {
  if (!isValidDimension(input.width) || !isValidDimension(input.height)) {
    throw new WordSearchError(
      'INVALID_DIMENSIONS',
      'Grid dimensions must be finite positive integers',
    )
  }

  const words = normalizeWords(input.words, input.language)
  if (words.length === 0) {
    throw new WordSearchError('NO_WORDS', 'At least one non-empty word is required')
  }

  if (input.directions.length === 0) {
    throw new WordSearchError('NO_DIRECTIONS', 'At least one placement direction is required')
  }

  for (const word of words) {
    const wordLength = Array.from(word).length
    const canFit = input.directions.some((direction) =>
      fitsDirection(wordLength, direction, input.width, input.height),
    )

    if (!canFit) {
      throw new WordSearchError(
        'WORD_DOES_NOT_FIT',
        `Word "${word}" does not fit in any selected direction`,
      )
    }
  }

  return words
}
