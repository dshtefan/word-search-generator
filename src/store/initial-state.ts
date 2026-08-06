import type { WordSearchState } from './types'

const DEFAULT_WORDS = [
  'Fußball',
  'Äpfel',
  'Größe',
  'Übung',
  'Straße',
  'Züge',
  'Österreich',
  'Tränen',
  'Löffel',
  'Gemüse',
  'Grüß',
] as const

/** Creates independent mutable settings arrays for every store instance and reset. */
export function createInitialState(): WordSearchState {
  return {
    settings: {
      generation: {
        words: [...DEFAULT_WORDS],
        language: 'de',
        width: 19,
        height: 19,
        cardinalDirections: ['up', 'down', 'left', 'right'],
        diagonalDirections: ['up-left', 'up-right', 'down-left', 'down-right'],
        crossingPreference: 50,
        spreadStrength: 50,
      },
      appearance: {
        highlightColor: '#90a4ae',
        fontFamily: 'Open Sans',
        fontSize: 28,
        gridStyle: 'outer',
        customFont: { enabled: false, url: '' },
        localFont: { enabled: false, family: '', fullName: '', style: '' },
      },
      output: {
        mode: 'natural',
        resolution: { width: 1024, height: 768 },
        aspectRatio: { width: 16, height: 9 },
      },
    },
    current: null,
    status: 'idle',
    error: null,
    savedGenerations: [],
  }
}
