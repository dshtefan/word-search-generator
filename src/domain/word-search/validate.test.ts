import type { GenerationInput } from './types'
import { validateGenerationInput } from './validate'

const validInput: GenerationInput = {
  words: ['WORD'],
  directions: ['right'],
  width: 4,
  height: 4,
  language: 'en',
}

describe('validateGenerationInput', () => {
  test.each([NaN, Infinity, 1.5, 0, -1])(
    'rejects an invalid width of %p',
    (width) => {
      expect(() => validateGenerationInput({ ...validInput, width })).toThrow(
        expect.objectContaining({ code: 'INVALID_DIMENSIONS' }),
      )
    },
  )

  test.each([NaN, Infinity, 1.5, 0, -1])(
    'rejects an invalid height of %p',
    (height) => {
      expect(() => validateGenerationInput({ ...validInput, height })).toThrow(
        expect.objectContaining({ code: 'INVALID_DIMENSIONS' }),
      )
    },
  )

  test('rejects inputs whose words normalize to no entries', () => {
    expect(() => validateGenerationInput({ ...validInput, words: ['', '  '] })).toThrow(
      expect.objectContaining({ code: 'NO_WORDS' }),
    )
  })

  test('rejects inputs without any allowed directions', () => {
    expect(() => validateGenerationInput({ ...validInput, directions: [] })).toThrow(
      expect.objectContaining({ code: 'NO_DIRECTIONS' }),
    )
  })

  test('rejects a word that cannot fit any allowed direction', () => {
    expect(() => validateGenerationInput({
      words: ['ABCDE'], directions: ['left', 'right'], width: 4, height: 8, language: 'en',
    })).toThrow(expect.objectContaining({ code: 'WORD_DOES_NOT_FIT' }))
  })

  test('accepts a word that fits in a vertical direction only', () => {
    expect(() => validateGenerationInput({
      words: ['ABCDE'], directions: ['down'], width: 4, height: 5, language: 'en',
    })).not.toThrow()
  })
})
