/** @jest-environment node */

import type { SavedGeneration } from '@/features/saved-generations/types'
import { createExportDocument } from './create-document'

const snapshot: SavedGeneration = {
  id: 'saved-1',
  name: 'Crossing words',
  createdAt: 1,
  settings: {
    generation: {
      words: ['CAT', 'BAR'],
      language: 'en',
      width: 3,
      height: 3,
      cardinalDirections: ['right', 'down'],
      diagonalDirections: [],
    },
    appearance: {
      highlightColor: '#123456',
      fontFamily: 'Example Sans',
      fontSize: 12,
      gridStyle: 'full',
      customFont: { enabled: false, url: '' },
      localFont: {
        enabled: false,
        family: '',
        fullName: '',
        style: '',
      },
    },
    output: {
      mode: 'natural',
      resolution: { width: 120, height: 90 },
      aspectRatio: { width: 2, height: 1 },
    },
  },
  result: {
    puzzle: [
      [{ letter: 'X' }, { letter: 'B' }, { letter: 'Y' }],
      [{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }],
      [{ letter: 'Z' }, { letter: 'R' }, { letter: 'Q' }],
    ],
    solution: [
      [{ letter: '' }, { letter: 'B' }, { letter: '' }],
      [{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }],
      [{ letter: '' }, { letter: 'R' }, { letter: '' }],
    ],
    placements: [
      { x: 0, y: 1, wordIndex: 0, direction: 'right', word: 'CAT' },
      { x: 1, y: 0, wordIndex: 1, direction: 'down', word: 'BAR' },
    ],
  },
}

describe('createExportDocument', () => {
  test('uses natural cell geometry and the requested puzzle grid', () => {
    const document = createExportDocument(snapshot, { answers: false })

    expect(document.width).toBe(60)
    expect(document.height).toBe(60)
    expect(document.cells).toEqual([
      { letter: 'X', x: 0, y: 0, width: 20, height: 20 },
      { letter: 'B', x: 20, y: 0, width: 20, height: 20 },
      { letter: 'Y', x: 40, y: 0, width: 20, height: 20 },
      { letter: 'C', x: 0, y: 20, width: 20, height: 20 },
      { letter: 'A', x: 20, y: 20, width: 20, height: 20 },
      { letter: 'T', x: 40, y: 20, width: 20, height: 20 },
      { letter: 'Z', x: 0, y: 40, width: 20, height: 20 },
      { letter: 'R', x: 20, y: 40, width: 20, height: 20 },
      { letter: 'Q', x: 40, y: 40, width: 20, height: 20 },
    ])
    expect(document.paths).toEqual([])
  })

  test('uses explicit resolution dimensions and scaled cell rectangles', () => {
    const resolutionSnapshot = structuredClone(snapshot)
    resolutionSnapshot.settings.output.mode = 'resolution'

    const document = createExportDocument(resolutionSnapshot, { answers: false })

    expect(document.width).toBe(120)
    expect(document.height).toBe(90)
    expect(document.cells[4]).toEqual({
      letter: 'A',
      x: 40,
      y: 30,
      width: 40,
      height: 30,
    })
  })

  test('expands natural dimensions to the configured aspect ratio', () => {
    const aspectSnapshot = structuredClone(snapshot)
    aspectSnapshot.settings.output.mode = 'aspect-ratio'

    const document = createExportDocument(aspectSnapshot, { answers: false })

    expect(document.width).toBe(120)
    expect(document.height).toBe(60)
    expect(document.cells[4]).toEqual({
      letter: 'A',
      x: 40,
      y: 20,
      width: 40,
      height: 20,
    })
  })

  test('uses the solution and keeps crossing placements as separate answer paths', () => {
    const document = createExportDocument(snapshot, { answers: true })

    expect(document.cells[0].letter).toBe('')
    expect(document.paths).toEqual([
      {
        wordIndex: 0,
        x1: 10,
        y1: 30,
        x2: 50,
        y2: 30,
        strokeWidth: 14,
      },
      {
        wordIndex: 1,
        x1: 30,
        y1: 10,
        x2: 30,
        y2: 50,
        strokeWidth: 14,
      },
    ])
  })

  test.each(['full', 'outer', 'none'] as const)(
    'preserves the %s grid border style',
    (gridStyle) => {
      const styledSnapshot = structuredClone(snapshot)
      styledSnapshot.settings.appearance.gridStyle = gridStyle

      expect(createExportDocument(styledSnapshot, { answers: false }).gridStyle)
        .toBe(gridStyle)
    },
  )

  test('captures appearance and parsed local-font style without callbacks', () => {
    const styledSnapshot = structuredClone(snapshot)
    styledSnapshot.settings.appearance.highlightColor = '#aabbcc'
    styledSnapshot.settings.appearance.fontFamily = 'Local Family'
    styledSnapshot.settings.appearance.fontSize = 24
    styledSnapshot.settings.appearance.localFont = {
      enabled: true,
      family: 'Local Family',
      fullName: 'Local Family Semi Bold Italic',
      style: 'Semi Bold Italic',
    }

    const document = createExportDocument(styledSnapshot, { answers: true })

    expect(document.highlightColor).toBe('#aabbcc')
    expect(document.font).toEqual({
      family: 'Local Family',
      size: 24,
      style: 'italic',
      weight: 600,
      localFamily: 'Local Family',
    })
    expect(Object.values(document).some((value) => typeof value === 'function'))
      .toBe(false)
  })

  test('retains an enabled custom font URL for pure serialization', () => {
    const customSnapshot = structuredClone(snapshot)
    customSnapshot.settings.appearance.customFont = {
      enabled: true,
      url: 'https://example.com/font.css?family=A&B',
    }

    expect(createExportDocument(customSnapshot, { answers: false }).font)
      .toEqual({
        family: 'Example Sans',
        size: 12,
        customUrl: 'https://example.com/font.css?family=A&B',
      })
  })
})
