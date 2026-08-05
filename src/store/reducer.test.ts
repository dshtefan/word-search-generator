/** @jest-environment node */

import type { WordSearchResult } from '@/domain/word-search'
import type { SavedGeneration } from '@/features/saved-generations/types'
import { createInitialState } from './initial-state'
import { wordSearchReducer } from './reducer'

const result: WordSearchResult = {
  puzzle: [[{ letter: 'A' }]],
  solution: [[{ letter: 'A' }]],
  placements: [{
    x: 0,
    y: 0,
    wordIndex: 0,
    direction: 'right',
    word: 'A',
  }],
}

describe('wordSearchReducer', () => {
  test('a generation-settings patch invalidates the current result', () => {
    const readyState = wordSearchReducer(createInitialState(), {
      type: 'generation/succeeded',
      payload: result,
    })

    const nextState = wordSearchReducer(readyState, {
      type: 'generation/changed',
      payload: { width: 25 },
    })

    expect(nextState).toEqual(expect.objectContaining({
      current: null,
      status: 'idle',
      error: null,
    }))
    expect(nextState.settings.generation.width).toBe(25)
    expect(nextState.settings.generation).not.toBe(readyState.settings.generation)
    expect(nextState.settings.appearance).toBe(readyState.settings.appearance)
    expect(readyState.current).toBe(result)
  })

  test('an appearance patch preserves the generated result', () => {
    const readyState = wordSearchReducer(createInitialState(), {
      type: 'generation/succeeded',
      payload: result,
    })

    const nextState = wordSearchReducer(readyState, {
      type: 'appearance/changed',
      payload: {
        highlightColor: '#ffffff',
        localFont: { enabled: true },
      },
    })

    expect(nextState.current).toBe(result)
    expect(nextState.status).toBe('ready')
    expect(nextState.settings.appearance.highlightColor).toBe('#ffffff')
    expect(nextState.settings.appearance.localFont).toEqual({
      enabled: true,
      family: '',
      fullName: '',
      style: '',
    })
    expect(nextState.settings.appearance.localFont).not.toBe(
      readyState.settings.appearance.localFont,
    )
  })

  test('output mode is represented by one mutually exclusive value', () => {
    const resolutionState = wordSearchReducer(createInitialState(), {
      type: 'output/modeChanged',
      payload: 'resolution',
    })
    const aspectRatioState = wordSearchReducer(resolutionState, {
      type: 'output/modeChanged',
      payload: 'aspect-ratio',
    })

    expect(resolutionState.settings.output.mode).toBe('resolution')
    expect(aspectRatioState.settings.output.mode).toBe('aspect-ratio')
    expect(Object.keys(aspectRatioState.settings.output)).not.toEqual(
      expect.arrayContaining(['useResolution', 'useAspectRatio']),
    )
  })

  test('an output patch preserves the result and nested output defaults', () => {
    const readyState = wordSearchReducer(createInitialState(), {
      type: 'generation/succeeded',
      payload: result,
    })

    const nextState = wordSearchReducer(readyState, {
      type: 'output/changed',
      payload: { resolution: { width: 640 } },
    })

    expect(nextState.current).toBe(result)
    expect(nextState.settings.output.resolution).toEqual({ width: 640, height: 768 })
    expect(nextState.settings.output.resolution).not.toBe(
      readyState.settings.output.resolution,
    )
  })

  test('an undefined generation patch member preserves its current value', () => {
    const initial = createInitialState()

    const nextState = wordSearchReducer(initial, {
      type: 'generation/changed',
      payload: { width: undefined },
    })

    expect(nextState.settings.generation.width).toBe(19)
  })

  test('an undefined appearance patch member preserves its current value', () => {
    const initial = createInitialState()

    const nextState = wordSearchReducer(initial, {
      type: 'appearance/changed',
      payload: { fontSize: undefined },
    })

    expect(nextState.settings.appearance.fontSize).toBe(28)
  })

  test('an undefined nested appearance member preserves its current value', () => {
    const initial = createInitialState()

    const nextState = wordSearchReducer(initial, {
      type: 'appearance/changed',
      payload: { localFont: { enabled: undefined } },
    })

    expect(nextState.settings.appearance.localFont.enabled).toBe(false)
  })

  test('an undefined nested output member preserves its current value', () => {
    const initial = createInitialState()

    const nextState = wordSearchReducer(initial, {
      type: 'output/changed',
      payload: { resolution: { width: undefined } },
    })

    expect(nextState.settings.output.resolution.width).toBe(1024)
  })

  test('generation success publishes the result and clears status atomically', () => {
    const generatingState = wordSearchReducer(createInitialState(), {
      type: 'generation/started',
    })

    const nextState = wordSearchReducer(generatingState, {
      type: 'generation/succeeded',
      payload: result,
    })

    expect(generatingState).toEqual(expect.objectContaining({
      current: null,
      status: 'generating',
      error: null,
    }))
    expect(nextState).toEqual(expect.objectContaining({
      current: result,
      status: 'ready',
      error: null,
    }))
  })

  test('generation failure clears a stale result in one transition', () => {
    const readyState = wordSearchReducer(createInitialState(), {
      type: 'generation/succeeded',
      payload: result,
    })

    const nextState = wordSearchReducer(readyState, {
      type: 'generation/failed',
      payload: 'Generation failed',
    })

    expect(nextState).toEqual(expect.objectContaining({
      current: null,
      status: 'error',
      error: 'Generation failed',
    }))
  })

  test('saved-generation operations add, remove, and apply snapshots atomically', () => {
    const baseState = createInitialState()
    const saved: SavedGeneration = {
      id: 'saved-1',
      name: 'First puzzle',
      createdAt: 123,
      settings: {
        ...baseState.settings,
        generation: { ...baseState.settings.generation, width: 7 },
      },
      result,
    }

    const addedState = wordSearchReducer(baseState, {
      type: 'saved/added',
      payload: saved,
    })
    const appliedState = wordSearchReducer(addedState, {
      type: 'saved/applied',
      payload: saved,
    })
    const removedState = wordSearchReducer(appliedState, {
      type: 'saved/removed',
      payload: saved.id,
    })

    expect(addedState.savedGenerations).toEqual([saved])
    expect(baseState.savedGenerations).toEqual([])
    expect(appliedState).toEqual(expect.objectContaining({
      settings: saved.settings,
      current: result,
      status: 'ready',
      error: null,
    }))
    expect(removedState.savedGenerations).toEqual([])
  })

  test('applying a saved generation restores independent copies of every field', () => {
    const baseState = createInitialState()
    const saved: SavedGeneration = {
      id: 'saved-complete',
      name: 'Complete puzzle',
      createdAt: 456,
      settings: {
        generation: {
          words: ['ALPHA', 'BETA'],
          language: 'en',
          width: 8,
          height: 6,
          cardinalDirections: ['left', 'right'],
          diagonalDirections: ['up-left', 'down-right'],
        },
        appearance: {
          highlightColor: '#abcdef',
          fontFamily: 'Example',
          fontSize: 41,
          gridStyle: 'none',
          customFont: { enabled: true, url: 'https://example.com/font.css' },
          localFont: {
            enabled: true,
            family: 'Local',
            fullName: 'Local Bold',
            style: 'Bold',
          },
        },
        output: {
          mode: 'aspect-ratio',
          resolution: { width: 1200, height: 800 },
          aspectRatio: { width: 4, height: 3 },
        },
      },
      result: {
        puzzle: [[{ letter: 'A' }, { letter: 'B' }]],
        solution: [[{ letter: 'A' }, { letter: '' }]],
        placements: [{
          x: 0,
          y: 0,
          wordIndex: 0,
          direction: 'right',
          word: 'AB',
        }],
      },
    }

    const nextState = wordSearchReducer(baseState, {
      type: 'saved/applied',
      payload: saved,
    })

    expect(nextState).toEqual(expect.objectContaining({
      settings: saved.settings,
      current: saved.result,
      status: 'ready',
      error: null,
    }))
    expect(nextState.settings).not.toBe(saved.settings)
    expect(nextState.settings.generation.words).not.toBe(saved.settings.generation.words)
    expect(nextState.current).not.toBe(saved.result)
    expect(nextState.current?.puzzle[0]).not.toBe(saved.result.puzzle[0])
    expect(nextState.current?.placements).not.toBe(saved.result.placements)
  })

  test('reset creates fresh defaults without reusing mutable arrays', () => {
    const initial = createInitialState()
    const resetOnce = wordSearchReducer(initial, { type: 'reset' })
    const resetTwice = wordSearchReducer(resetOnce, { type: 'reset' })

    expect(resetOnce).toEqual(createInitialState())
    expect(resetOnce).not.toBe(initial)
    expect(resetTwice.settings.generation.words).not.toBe(
      resetOnce.settings.generation.words,
    )
    expect(resetTwice.settings.generation.cardinalDirections).not.toBe(
      resetOnce.settings.generation.cardinalDirections,
    )
    expect(resetTwice.settings.generation.diagonalDirections).not.toBe(
      resetOnce.settings.generation.diagonalDirections,
    )
    expect(resetTwice.savedGenerations).not.toBe(resetOnce.savedGenerations)
  })
})
