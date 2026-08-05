import { WordSearchError } from '@/domain/word-search'
import type {
  GenerateWordSearchOptions,
  WordSearchErrorCode,
} from '@/domain/word-search'
import type { GenerationSettings } from '@/store'
import { runGeneration } from './run-generation'

const validSettings: GenerationSettings = {
  words: ['cat'],
  language: 'en',
  width: 3,
  height: 3,
  cardinalDirections: ['right'],
  diagonalDirections: [],
}

interface FailureCase {
  name: string
  settings: GenerationSettings
  options?: GenerateWordSearchOptions
  message: string
  code: WordSearchErrorCode
}

const failureCases: FailureCase[] = [
  {
    name: 'NO_WORDS',
    settings: { ...validSettings, words: [' '] },
    message: 'At least one word is required',
    code: 'NO_WORDS',
  },
  {
    name: 'NO_DIRECTIONS',
    settings: {
      ...validSettings,
      cardinalDirections: [],
      diagonalDirections: [],
    },
    message: 'At least one direction must be selected',
    code: 'NO_DIRECTIONS',
  },
  {
    name: 'INVALID_DIMENSIONS',
    settings: { ...validSettings, width: 0 },
    message: 'Grid dimensions must be positive integers',
    code: 'INVALID_DIMENSIONS',
  },
  {
    name: 'WORD_DOES_NOT_FIT',
    settings: { ...validSettings, words: ['toolong'] },
    message: 'At least one word does not fit in the selected grid',
    code: 'WORD_DOES_NOT_FIT',
  },
  {
    name: 'PLACEMENT_EXHAUSTED',
    settings: validSettings,
    options: { random: () => 0, maxAttempts: 0 },
    message: 'Could not place every word — try a larger grid or fewer words',
    code: 'PLACEMENT_EXHAUSTED',
  },
]

describe('runGeneration', () => {
  test('generates a result from both direction groups', () => {
    const outcome = runGeneration({
      ...validSettings,
      cardinalDirections: [],
      diagonalDirections: ['down-right'],
    }, { random: () => 0 })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) throw new Error('Expected generation to succeed')
    expect(outcome.value.placements).toEqual([
      expect.objectContaining({ direction: 'down-right', word: 'CAT' }),
    ])
  })

  test.each(failureCases)(
    'maps $name to its user-facing message',
    ({ settings, options, message, code }) => {
      const outcome = runGeneration(settings, options)

      expect(outcome).toEqual(expect.objectContaining({ ok: false, message }))
      if (!('cause' in outcome)) throw new Error('Expected generation to fail')
      expect(outcome.cause).toBeInstanceOf(WordSearchError)
      expect((outcome.cause as WordSearchError).code).toBe(code)
    },
  )

  test('uses a fallback message and preserves an unknown cause', () => {
    const cause = new Error('random source failed')

    const outcome = runGeneration(validSettings, {
      random: () => {
        throw cause
      },
    })

    expect(outcome).toEqual({
      ok: false,
      message: 'Unable to generate word search',
      cause,
    })
  })
})
