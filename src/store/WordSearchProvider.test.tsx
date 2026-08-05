import { act, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createInitialState } from './initial-state'
import type { StorageAdapter } from '@/features/saved-generations/repository'
import type { ExportResult } from '@/features/export/types'
import {
  WordSearchProvider,
  useWordSearch,
  type WordSearchContextValue,
} from './WordSearchProvider'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

const browserStructuredClone = globalThis.structuredClone

beforeAll(() => {
  globalThis.structuredClone = <T,>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T
})

afterAll(() => {
  globalThis.structuredClone = browserStructuredClone
})

class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>()
  readonly gets: string[] = []
  readonly sets: Array<{ key: string; value: string }> = []
  readonly removals: string[] = []

  getItem(key: string): string | null {
    this.gets.push(key)
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.sets.push({ key, value })
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.removals.push(key)
    this.values.delete(key)
  }
}

const success: ExportResult = { ok: true }

function createExportServiceStub() {
  return {
    exportCurrent: jest.fn(async () => success),
    exportSaved: jest.fn(async () => success),
  }
}

interface HarnessProps {
  onValue(value: WordSearchContextValue): void
}

function Harness({ onValue }: HarnessProps) {
  onValue(useWordSearch())
  return null
}

function renderProvider(storage = new MemoryStorage()) {
  const exportService = createExportServiceStub()
  const values: WordSearchContextValue[] = []
  const onValue = (value: WordSearchContextValue) => values.push(value)
  const dependencies = {
    storage,
    random: () => 0,
    createId: () => 'fixed-id',
    now: () => 1_725_555_555_000,
    exportService,
  }
  const view = render(
    <WordSearchProvider dependencies={dependencies}>
      <Harness onValue={onValue} />
    </WordSearchProvider>,
  )

  return {
    storage,
    exportService,
    values,
    latest: () => values[values.length - 1],
    rerender(children?: ReactNode) {
      view.rerender(
        <WordSearchProvider dependencies={dependencies}>
          {children ?? <Harness onValue={onValue} />}
        </WordSearchProvider>,
      )
    },
  }
}

function prepareSmallGeneration(context: WordSearchContextValue): void {
  context.updateGeneration({
    words: ['cat'],
    language: 'en',
    width: 3,
    height: 1,
    cardinalDirections: ['right'],
    diagonalDirections: [],
  })
}

describe('WordSearchProvider commands', () => {
  test('generates a deterministic result in one final success render', () => {
    const harness = renderProvider()

    act(() => prepareSmallGeneration(harness.latest()))
    const renderCountBeforeGenerate = harness.values.length
    act(() => harness.latest().generate())

    const generatedRenders = harness.values.slice(renderCountBeforeGenerate)
    expect(generatedRenders).toHaveLength(1)
    expect(generatedRenders[0].state.status).toBe('ready')
    expect(generatedRenders[0].state.error).toBeNull()
    expect(generatedRenders[0].state.current).toEqual({
      puzzle: [[{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }]],
      solution: [[{ letter: 'C' }, { letter: 'A' }, { letter: 'T' }]],
      placements: [{
        x: 0,
        y: 0,
        wordIndex: 0,
        direction: 'right',
        word: 'CAT',
      }],
    })
  })

  test('saves a complete settings snapshot with injected identity and time', () => {
    const harness = renderProvider()
    act(() => prepareSmallGeneration(harness.latest()))
    act(() => harness.latest().generate())
    act(() => {
      harness.latest().updateAppearance({
        highlightColor: '#123456',
        fontFamily: 'Georgia',
        fontSize: 34,
        gridStyle: 'full',
      })
      harness.latest().updateOutput({
        mode: 'resolution',
        resolution: { width: 800, height: 600 },
      })
    })
    const settingsAtSave = structuredClone(harness.latest().state.settings)

    act(() => harness.latest().saveGeneration('  Lesson One  '))

    expect(harness.latest().state.savedGenerations).toEqual([expect.objectContaining({
      id: 'fixed-id',
      name: 'Lesson One',
      createdAt: 1_725_555_555_000,
      settings: settingsAtSave,
      result: harness.latest().state.current,
    })])
    expect(JSON.parse(harness.storage.values.get('word-search:saved-generations')!))
      .toEqual({ version: 1, data: harness.latest().state.savedGenerations })
  })

  test('applies a saved snapshot atomically and persists restored preferences', () => {
    const harness = renderProvider()
    act(() => prepareSmallGeneration(harness.latest()))
    act(() => harness.latest().generate())
    act(() => harness.latest().saveGeneration('Original'))
    const saved = structuredClone(harness.latest().state.savedGenerations[0])
    act(() => harness.latest().updateGeneration({ words: ['changed'] }))
    act(() => harness.latest().updateAppearance({ fontFamily: 'Arial' }))
    const renderCountBeforeApply = harness.values.length

    act(() => harness.latest().applySaved('fixed-id'))

    const appliedRenders = harness.values.slice(renderCountBeforeApply)
    expect(appliedRenders).toHaveLength(1)
    expect(appliedRenders[0].state).toEqual(expect.objectContaining({
      settings: saved.settings,
      current: saved.result,
      status: 'ready',
      error: null,
    }))
    expect(JSON.parse(harness.storage.values.get('word-search:preferences')!))
      .toEqual({ version: 1, data: saved.settings })
  })

  test('removes saved snapshots without changing the current generation', () => {
    const harness = renderProvider()
    act(() => prepareSmallGeneration(harness.latest()))
    act(() => harness.latest().generate())
    act(() => harness.latest().saveGeneration('Temporary'))
    const current = harness.latest().state.current

    act(() => harness.latest().removeSaved('fixed-id'))

    expect(harness.latest().state.savedGenerations).toEqual([])
    expect(harness.latest().state.current).toBe(current)
    expect(JSON.parse(harness.storage.values.get('word-search:saved-generations')!))
      .toEqual({ version: 1, data: [] })
  })

  test('resets preferences atomically without deleting saved generations', () => {
    const harness = renderProvider()
    act(() => prepareSmallGeneration(harness.latest()))
    act(() => harness.latest().generate())
    act(() => harness.latest().saveGeneration('Keep me'))
    const saved = harness.latest().state.savedGenerations
    const savedEnvelope = harness.storage.values.get('word-search:saved-generations')

    act(() => harness.latest().reset())

    expect(harness.latest().state).toEqual({
      ...createInitialState(),
      savedGenerations: saved,
    })
    expect(harness.storage.values.has('word-search:preferences')).toBe(false)
    expect(harness.storage.values.get('word-search:saved-generations')).toBe(savedEnvelope)
  })

  test('initializes repositories once, persists changes, and memoizes context', () => {
    const storage = new MemoryStorage()
    const harness = renderProvider(storage)
    const firstValue = harness.latest()
    const initialPreferenceWrites = storage.sets.filter(
      ({ key }) => key === 'word-search:preferences',
    ).length

    harness.rerender()
    expect(storage.gets).toEqual([
      'word-search:preferences',
      'word-search:saved-generations',
    ])
    expect(harness.latest()).toBe(firstValue)
    expect(harness.latest().exportService).toBe(harness.exportService)

    act(() => harness.latest().updateAppearance({ highlightColor: '#abcdef' }))

    expect(storage.sets.filter(
      ({ key }) => key === 'word-search:preferences',
    )).toHaveLength(initialPreferenceWrites + 1)
    expect(JSON.parse(storage.values.get('word-search:preferences')!))
      .toEqual({ version: 1, data: harness.latest().state.settings })
  })
})
