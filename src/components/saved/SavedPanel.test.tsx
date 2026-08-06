import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SavedGeneration } from '@/features/saved-generations/types'
import type { StorageAdapter } from '@/features/saved-generations/repository'
import {
  WordSearchProvider,
  createWordSearchRuntime,
  useWordSearch,
  type WordSearchContextValue,
} from '@/store/WordSearchProvider'
import { SavedPanel } from './SavedPanel'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

const browserPointerEvent = Object.getOwnPropertyDescriptor(globalThis, 'PointerEvent')
const browserStructuredClone = globalThis.structuredClone

beforeAll(() => {
  Object.defineProperty(globalThis, 'PointerEvent', {
    configurable: true,
    value: MouseEvent,
  })
  globalThis.structuredClone = <T,>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T
})

afterAll(() => {
  if (browserPointerEvent) {
    Object.defineProperty(globalThis, 'PointerEvent', browserPointerEvent)
  } else {
    Reflect.deleteProperty(globalThis, 'PointerEvent')
  }
  globalThis.structuredClone = browserStructuredClone
})

const saved: SavedGeneration = {
  id: 'reused-id',
  name: 'Original',
  createdAt: 1,
  settings: {
    generation: {
      words: ['CAT'],
      language: 'en',
      width: 3,
      height: 1,
      cardinalDirections: ['right'],
      diagonalDirections: [],
    },
    appearance: {
      highlightColor: '#90a4ae',
      fontFamily: 'Arial',
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
  result: {
    puzzle: [[{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }]],
    solution: [[{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }]],
    placements: [{
      x: 0,
      y: 0,
      wordIndex: 0,
      direction: 'right',
      word: 'CAT',
    }],
  },
}

function createStorage(): StorageAdapter {
  const values = new Map<string, string>([[
    'word-search:saved-generations',
    JSON.stringify({ version: 1, data: [saved] }),
  ]])
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

describe('SavedPanel', () => {
  test('does not select a new snapshot that reuses a deleted selected ID', async () => {
    const user = userEvent.setup()
    let context!: WordSearchContextValue
    const runtime = createWordSearchRuntime({
      storage: createStorage(),
      createId: () => 'reused-id',
      now: () => 2,
    })
    const runtimeWithCurrent = {
      ...runtime,
      initialState: {
        ...runtime.initialState,
        current: saved.result,
        status: 'ready' as const,
      },
    }
    function CaptureContext() {
      context = useWordSearch()
      return null
    }
    render(
      <WordSearchProvider runtime={runtimeWithCurrent}>
        <CaptureContext />
        <SavedPanel />
      </WordSearchProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Generations 1' }))
    await user.click(screen.getAllByRole('checkbox')[1])
    await user.click(screen.getByTitle('Delete'))
    act(() => context.saveGeneration('Replacement'))

    expect(screen.getAllByRole('checkbox')[1]).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled()
  })

  test.each([
    ['empty', []],
    ['non-rectangular', [[{ letter: 'A' }], []]],
  ] as const)('shows safe dimensions for a %s saved grid', async (_label, puzzle) => {
    const user = userEvent.setup()
    const runtime = createWordSearchRuntime({ storage: createStorage() })
    const malformedRuntime = {
      ...runtime,
      initialState: {
        ...runtime.initialState,
        savedGenerations: [{
          ...saved,
          result: { ...saved.result, puzzle },
        }],
      },
    }
    render(
      <WordSearchProvider runtime={malformedRuntime}>
        <SavedPanel />
      </WordSearchProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Generations 1' }))

    expect(screen.getByText(/1 words, 0x0, Arial/)).toBeVisible()
  })
})
