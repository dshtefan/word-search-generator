import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Preview } from '@/components/preview/Preview'
import { Sidebar } from '@/components/sidebar/Sidebar'
import type { SavedGeneration } from '@/features/saved-generations/types'
import type { StorageAdapter } from '@/features/saved-generations/repository'
import {
  WordSearchProvider,
  createWordSearchRuntime,
  useWordSearch,
  type WordSearchContextValue,
} from '@/store'
import { renderWordSearch } from '@/test/render-app'
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
  test('saves, restores, and deletes a generated search without stale selection', async () => {
    const { user } = renderWordSearch(
      <>
        <Sidebar />
        <Preview />
        <SavedPanel />
      </>,
    )
    const words = screen.getByRole('textbox', { name: 'Words (one per line)' })
    await user.clear(words)
    await user.type(words, 'CAT')
    const width = screen.getByRole('spinbutton', { name: 'Grid width' })
    await user.tripleClick(width)
    await user.keyboard('5')
    const height = screen.getByRole('spinbutton', { name: 'Grid height' })
    await user.tripleClick(height)
    await user.keyboard('5')
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(screen.getAllByRole('cell')).toHaveLength(25)

    await user.click(screen.getByRole('button', { name: 'Save generation' }))
    const saveDialog = screen.getByRole('dialog', { name: 'Save Generation' })
    const nameInput = within(saveDialog).getByRole('textbox', { name: 'Name' })
    await user.clear(nameInput)
    await user.type(nameInput, 'Lesson One')
    await user.click(within(saveDialog).getByRole('button', { name: 'Save' }))

    await user.clear(words)
    await user.type(words, 'DOG')
    await user.tripleClick(width)
    await user.keyboard('6')
    expect(screen.getByText('Click Generate to create a word search')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Generations 1' }))
    await user.click(screen.getByRole('button', { name: 'Apply Lesson One' }))

    expect(words).toHaveValue('CAT')
    expect(width).toHaveValue(5)
    expect(screen.getAllByRole('cell')).toHaveLength(25)
    expect(screen.getByRole('button', { name: 'Save generation' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Generations 1' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select Lesson One' }))
    expect(screen.getByRole('button', { name: 'Export selected (1)' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Delete Lesson One' }))

    expect(screen.queryByText('Lesson One')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generations 0' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Export selected (0)' })).toBeDisabled()
  })

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
