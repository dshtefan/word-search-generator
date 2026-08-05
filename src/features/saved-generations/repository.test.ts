/** @jest-environment node */

import type { SavedGeneration } from './types'
import { createSavedGenerationsRepository } from './repository'

class MemoryStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const saved: SavedGeneration = {
  id: 'saved-1',
  name: 'Lesson 1',
  createdAt: 1_754_419_200_000,
  settings: {
    generation: {
      words: ['CAT'],
      language: 'en',
      width: 3,
      height: 2,
      cardinalDirections: ['right'],
      diagonalDirections: ['down-right'],
    },
    appearance: {
      highlightColor: '#123456',
      fontFamily: 'Geist',
      fontSize: 28,
      gridStyle: 'full',
      customFont: { enabled: true, url: 'https://example.com/font.css' },
      localFont: {
        enabled: false,
        family: '',
        fullName: '',
        style: '',
      },
    },
    output: {
      mode: 'resolution',
      resolution: { width: 1600, height: 900 },
      aspectRatio: { width: 16, height: 9 },
    },
  },
  result: {
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
  },
}

function versionOne(data: unknown): string {
  return JSON.stringify({ version: 1, data })
}

describe('createSavedGenerationsRepository', () => {
  test('loads a complete version-1 envelope', () => {
    const storage = new MemoryStorage()
    storage.values.set('saved-key', versionOne([saved]))

    const repository = createSavedGenerationsRepository(storage, 'saved-key')

    expect(repository.load()).toEqual([saved])
  })

  test.each([
    ['invalid JSON', '{'],
    ['unsupported version', JSON.stringify({ version: 2, data: [saved] })],
    ['missing envelope data', JSON.stringify({ version: 1 })],
  ])('returns an empty list for %s', (_label, raw) => {
    const storage = new MemoryStorage()
    storage.values.set('saved-key', raw)

    expect(createSavedGenerationsRepository(storage, 'saved-key').load()).toEqual([])
  })

  test.each([
    ['a missing item field', (item: Record<string, unknown>) => delete item.name],
    ['an invalid timestamp', (item: Record<string, unknown>) => { item.createdAt = -1 }],
    ['an invalid language enum', (item: Record<string, unknown>) => {
      const settings = item.settings as { generation: Record<string, unknown> }
      settings.generation.language = 'fr'
    }],
    ['an invalid direction enum', (item: Record<string, unknown>) => {
      const settings = item.settings as { generation: { cardinalDirections: unknown[] } }
      settings.generation.cardinalDirections[0] = 'sideways'
    }],
    ['an invalid grid-style enum', (item: Record<string, unknown>) => {
      const settings = item.settings as { appearance: Record<string, unknown> }
      settings.appearance.gridStyle = 'inside'
    }],
    ['an invalid output-mode enum', (item: Record<string, unknown>) => {
      const settings = item.settings as { output: Record<string, unknown> }
      settings.output.mode = 'fixed'
    }],
    ['non-positive generation dimensions', (item: Record<string, unknown>) => {
      const settings = item.settings as { generation: Record<string, unknown> }
      settings.generation.width = 0
    }],
    ['non-positive output dimensions', (item: Record<string, unknown>) => {
      const settings = item.settings as { output: { resolution: Record<string, unknown> } }
      settings.output.resolution.height = 0
    }],
    ['an empty grid', (item: Record<string, unknown>) => {
      const result = item.result as Record<string, unknown>
      result.puzzle = []
    }],
    ['a ragged grid', (item: Record<string, unknown>) => {
      const result = item.result as { puzzle: unknown[][] }
      result.puzzle[1] = [{ letter: 'X' }]
    }],
    ['grid dimensions that disagree with settings', (item: Record<string, unknown>) => {
      const settings = item.settings as { generation: Record<string, unknown> }
      settings.generation.height = 3
    }],
    ['an invalid grid cell', (item: Record<string, unknown>) => {
      const result = item.result as { puzzle: Array<Array<Record<string, unknown>>> }
      result.puzzle[0][0].letter = 9
    }],
    ['an invalid placement coordinate', (item: Record<string, unknown>) => {
      const result = item.result as { placements: Array<Record<string, unknown>> }
      result.placements[0].x = -1
    }],
    ['an invalid placement word index', (item: Record<string, unknown>) => {
      const result = item.result as { placements: Array<Record<string, unknown>> }
      result.placements[0].wordIndex = 2
    }],
    ['a placement extending beyond the grid', (item: Record<string, unknown>) => {
      const result = item.result as { placements: Array<Record<string, unknown>> }
      result.placements[0].x = 2
    }],
    ['a placement direction disabled by settings', (item: Record<string, unknown>) => {
      const settings = item.settings as { generation: { words: string[] } }
      settings.generation.words[0] = 'TAC'
      const result = item.result as { placements: Array<Record<string, unknown>> }
      result.placements[0] = {
        ...result.placements[0],
        x: 2,
        direction: 'left',
        word: 'TAC',
      }
    }],
    ['a placement word inconsistent with its settings index', (item: Record<string, unknown>) => {
      const settings = item.settings as { generation: { words: string[] } }
      settings.generation.words[0] = ' dog '
    }],
    ['a placement word inconsistent with the puzzle path', (item: Record<string, unknown>) => {
      const result = item.result as {
        puzzle: Array<Array<Record<string, unknown>>>
      }
      result.puzzle[0][1].letter = 'X'
    }],
    ['a placement word inconsistent with the solution path', (item: Record<string, unknown>) => {
      const result = item.result as {
        solution: Array<Array<Record<string, unknown>>>
      }
      result.solution[0][1].letter = 'X'
    }],
  ])('rejects the entire payload containing %s', (_label, mutate) => {
    const malformed = structuredClone(saved) as unknown as Record<string, unknown>
    mutate(malformed)
    const storage = new MemoryStorage()
    storage.values.set('saved-key', versionOne([saved, malformed]))

    expect(createSavedGenerationsRepository(storage, 'saved-key').load()).toEqual([])
  })

  test('saves the complete list in a version-1 envelope', () => {
    const storage = new MemoryStorage()
    const repository = createSavedGenerationsRepository(storage, 'saved-key')

    expect(repository.save([saved])).toBe(true)
    expect(JSON.parse(storage.values.get('saved-key') ?? '')).toEqual({
      version: 1,
      data: [saved],
    })
  })

  test('returns false instead of throwing when storage rejects a write', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }

    expect(createSavedGenerationsRepository(storage, 'saved-key').save([saved])).toBe(false)
  })

  test('clear removes the repository key', () => {
    const storage = new MemoryStorage()
    storage.values.set('saved-key', versionOne([saved]))

    createSavedGenerationsRepository(storage, 'saved-key').clear()

    expect(storage.values.has('saved-key')).toBe(false)
  })

  test('clear does not throw when storage rejects removal', () => {
    const storage = new MemoryStorage()
    storage.removeItem = () => {
      throw new DOMException('Storage blocked', 'SecurityError')
    }

    const repository = createSavedGenerationsRepository(storage, 'saved-key')

    expect(() => repository.clear()).not.toThrow()
  })
})
