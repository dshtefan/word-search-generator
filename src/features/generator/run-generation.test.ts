import { getPlacementCells, WordSearchError } from '@/domain/word-search'
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
  crossingPreference: 50,
  spreadStrength: 50,
}

interface FailureCase {
  name: string
  settings: GenerationSettings
  options?: GenerateWordSearchOptions
  code: WordSearchErrorCode
}

const failureCases: FailureCase[] = [
  {
    name: 'NO_WORDS',
    settings: { ...validSettings, words: [' '] },
    code: 'NO_WORDS',
  },
  {
    name: 'NO_DIRECTIONS',
    settings: {
      ...validSettings,
      cardinalDirections: [],
      diagonalDirections: [],
    },
    code: 'NO_DIRECTIONS',
  },
  {
    name: 'INVALID_DIMENSIONS',
    settings: { ...validSettings, width: 0 },
    code: 'INVALID_DIMENSIONS',
  },
  {
    name: 'WORD_DOES_NOT_FIT',
    settings: { ...validSettings, words: ['toolong'] },
    code: 'WORD_DOES_NOT_FIT',
  },
  {
    name: 'PLACEMENT_EXHAUSTED',
    settings: validSettings,
    options: { random: () => 0, maxAttempts: 0 },
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

  test('forwards generation balance settings to placement scoring', () => {
    const base = {
      ...validSettings,
      words: ['abc', 'bxy'],
      width: 5,
      height: 5,
      cardinalDirections: ['right', 'down'] as const,
    }
    const countSharedCells = (crossingPreference: number, spreadStrength: number) => {
      const outcome = runGeneration({
        ...base,
        cardinalDirections: [...base.cardinalDirections],
        crossingPreference,
        spreadStrength,
      }, { random: () => 0 })
      if (!outcome.ok) throw new Error('Expected generation to succeed')
      const occupied = outcome.value.placements.map((placement) => new Set(
        getPlacementCells(placement, placement.direction, placement.word.length)
          .map(({ x, y }) => `${x},${y}`),
      ))
      return [...occupied[0]].filter((cell) => occupied[1].has(cell)).length
    }

    expect(countSharedCells(100, 0)).toBe(1)
    expect(countSharedCells(0, 100)).toBe(0)
  })

  test.each(failureCases)(
    'preserves the $name domain error code',
    ({ settings, options, code }) => {
      const outcome = runGeneration(settings, options)

      expect(outcome).toEqual(expect.objectContaining({ ok: false, code }))
      if (!('cause' in outcome)) throw new Error('Expected generation to fail')
      expect(outcome.cause).toBeInstanceOf(WordSearchError)
      expect((outcome.cause as WordSearchError).code).toBe(code)
    },
  )

  test('uses a fallback code and preserves an unknown cause', () => {
    const cause = new Error('random source failed')

    const outcome = runGeneration(validSettings, {
      random: () => {
        throw cause
      },
    })

    expect(outcome).toEqual({
      ok: false,
      code: 'UNKNOWN',
      cause,
    })
  })
})
