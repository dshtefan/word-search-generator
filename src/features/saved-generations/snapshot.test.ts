/** @jest-environment node */

import type { WordSearchResult } from '@/domain/word-search'
import { createInitialState } from '@/store/initial-state'
import { wordSearchReducer } from '@/store/reducer'
import { createSavedGeneration } from './snapshot'

const result: WordSearchResult = {
  puzzle: [
    [{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }],
    [{ letter: 'X' }, { letter: 'Y' }, { letter: 'Z' }],
  ],
  solution: [
    [{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }],
    [{ letter: '' }, { letter: '' }, { letter: '' }],
  ],
  placements: [{
    x: 0,
    y: 0,
    wordIndex: 0,
    direction: 'right',
    word: 'CAT',
  }],
}

function createReadyState() {
  const initial = createInitialState()
  const configured = {
    ...initial,
    settings: {
      generation: {
        words: ['CAT'],
        language: 'en' as const,
        width: 3,
        height: 2,
        cardinalDirections: ['right' as const],
        diagonalDirections: ['down-right' as const],
        crossingPreference: 50,
        spreadStrength: 50,
      },
      appearance: {
        highlightColor: '#123456',
        fontFamily: 'Geist',
        fontSize: 32,
        gridStyle: 'full' as const,
        customFont: { enabled: true, url: 'https://example.com/font.css' },
        localFont: {
          enabled: true,
          family: 'Example',
          fullName: 'Example Regular',
          style: 'Regular',
        },
      },
      output: {
        mode: 'resolution' as const,
        resolution: { width: 1600, height: 900 },
        aspectRatio: { width: 16, height: 9 },
      },
    },
  }

  return wordSearchReducer(configured, {
    type: 'generation/succeeded',
    payload: result,
  })
}

describe('createSavedGeneration', () => {
  test('captures a complete immutable settings and result snapshot', () => {
    const readyState = createReadyState()

    const saved = createSavedGeneration(readyState, '  Lesson 1  ', {
      createId: () => 'id-1',
      now: () => 123,
    })

    expect(saved).toEqual({
      id: 'id-1',
      name: 'Lesson 1',
      createdAt: 123,
      settings: readyState.settings,
      result: readyState.current,
    })
    expect(saved.settings).not.toBe(readyState.settings)
    expect(saved.settings.generation.words).not.toBe(
      readyState.settings.generation.words,
    )
    expect(saved.result).not.toBe(readyState.current)
    expect(saved.result.puzzle[0]).not.toBe(readyState.current?.puzzle[0])
    expect(Object.keys(saved)).not.toEqual(
      expect.arrayContaining(['status', 'error', 'savedGenerations']),
    )
  })

  test('uses the next generation number for a blank name', () => {
    const readyState = createReadyState()
    readyState.savedGenerations.push({
      id: 'existing',
      name: 'Existing',
      createdAt: 1,
      settings: readyState.settings,
      result,
    })

    const saved = createSavedGeneration(readyState, '   ', {
      createId: () => 'id-2',
      now: () => 456,
    })

    expect(saved.name).toBe('Generation 2')
  })

  test('rejects a state without a current result', () => {
    expect(() => createSavedGeneration(createInitialState(), 'Empty')).toThrow(
      'Cannot save a generation without a current result',
    )
  })
})
