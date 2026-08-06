import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Sidebar } from '@/components/sidebar/Sidebar'
import type { SavedGeneration } from '@/features/saved-generations/types'
import type { ExportResult } from '@/features/export/types'
import {
  WordSearchProvider,
  createWordSearchRuntime,
} from '@/store'
import { renderWordSearch } from '@/test/render-app'
import { SaveModal } from './SaveModal'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

const browserPointerEvent = Object.getOwnPropertyDescriptor(globalThis, 'PointerEvent')

beforeAll(() => {
  Object.defineProperty(globalThis, 'PointerEvent', {
    configurable: true,
    value: MouseEvent,
  })
})

afterAll(() => {
  if (browserPointerEvent) {
    Object.defineProperty(globalThis, 'PointerEvent', browserPointerEvent)
  } else {
    Reflect.deleteProperty(globalThis, 'PointerEvent')
  }
})

const saved: SavedGeneration = {
  id: 'saved-1',
  name: 'Lesson',
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

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, reject, resolve }
}

function SavedModalController() {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Reopen export</button>
      <SaveModal
        mode="saved"
        savedList={[saved]}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

describe('SaveModal', () => {
  beforeEach(() => window.localStorage.clear())

  test('keeps the dialog open and restores Save after an export rejection', async () => {
    const pending = createDeferred<ExportResult>()
    const exportService = {
      exportCurrent: jest.fn(() => pending.promise),
      exportSaved: jest.fn(),
    }
    const { user } = renderWordSearch(<Sidebar />, { exportService })
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const dialog = screen.getByRole('dialog', { name: 'Save Word Search' })

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    await act(async () => pending.reject(new Error('Export service unavailable')))

    expect(dialog).toBeVisible()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Export service unavailable',
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('keeps export failures visible, resets loading, and clears errors on retry', async () => {
    const user = userEvent.setup()
    const exportService = {
      exportCurrent: jest.fn(),
      exportSaved: jest.fn()
        .mockResolvedValueOnce({
          ok: false as const,
          message: 'Export storage is unavailable',
          cause: new Error('blocked'),
        })
        .mockResolvedValueOnce({ ok: true as const }),
    }
    const onOpenChange = jest.fn()
    const runtime = createWordSearchRuntime({ exportService })
    render(
      <WordSearchProvider runtime={runtime}>
        <SaveModal
          mode="saved"
          savedList={[saved]}
          open
          onOpenChange={onOpenChange}
        />
      </WordSearchProvider>,
    )

    const exportButton = screen.getByRole('button', { name: 'Export 1 generation' })
    await user.click(exportButton)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Export storage is unavailable',
    )
    expect(exportButton).toBeEnabled()
    expect(onOpenChange).not.toHaveBeenCalledWith(false)

    await user.click(exportButton)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(exportService.exportSaved).toHaveBeenLastCalledWith({
      snapshots: [saved],
      format: 'svg',
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('ignores a stale failure after close and reopen', async () => {
    const user = userEvent.setup()
    const first = createDeferred<ExportResult>()
    const exportService = {
      exportCurrent: jest.fn(),
      exportSaved: jest.fn(() => first.promise),
    }
    const runtime = createWordSearchRuntime({ exportService })
    render(
      <WordSearchProvider runtime={runtime}>
        <SavedModalController />
      </WordSearchProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Export 1 generation' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Reopen export' }))

    expect(screen.getByRole('button', { name: 'Export 1 generation' })).toBeEnabled()
    await act(async () => first.resolve({
      ok: false,
      message: 'Stale export failed',
      cause: new Error('stale'),
    }))
    expect(screen.queryByText('Stale export failed')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  test('lets a newer attempt outlive an overlapping stale completion', async () => {
    const user = userEvent.setup()
    const first = createDeferred<ExportResult>()
    const second = createDeferred<ExportResult>()
    const exportService = {
      exportCurrent: jest.fn(),
      exportSaved: jest.fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise),
    }
    const runtime = createWordSearchRuntime({ exportService })
    render(
      <WordSearchProvider runtime={runtime}>
        <SavedModalController />
      </WordSearchProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Export 1 generation' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Reopen export' }))
    await user.click(screen.getByRole('button', { name: 'Export 1 generation' }))

    await act(async () => first.resolve({ ok: true }))
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await act(async () => second.resolve({
      ok: false,
      message: 'Newest export failed',
      cause: new Error('newest'),
    }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Newest export failed')
  })

  test('exports the complete current snapshot with fallback naming and both variants', async () => {
    const user = userEvent.setup()
    const exportService = {
      exportCurrent: jest.fn().mockResolvedValue({ ok: true as const }),
      exportSaved: jest.fn(),
    }
    const runtime = createWordSearchRuntime({ exportService })
    const currentRuntime = {
      ...runtime,
      initialState: {
        ...runtime.initialState,
        settings: saved.settings,
        current: saved.result,
        status: 'ready' as const,
      },
    }
    render(
      <WordSearchProvider runtime={currentRuntime}>
        <SaveModal open onOpenChange={jest.fn()} />
      </WordSearchProvider>,
    )

    await user.clear(screen.getByLabelText('File name'))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(exportService.exportCurrent).toHaveBeenCalledWith({
      source: {
        id: 'current',
        name: 'ws',
        createdAt: 0,
        settings: saved.settings,
        result: saved.result,
      },
      format: 'svg',
      filename: 'ws',
      includeAnswers: true,
      includePuzzle: true,
    })
  })

  test('exports only the answer variant when both variants are unchecked', async () => {
    const user = userEvent.setup()
    const exportService = {
      exportCurrent: jest.fn().mockResolvedValue({ ok: true as const }),
      exportSaved: jest.fn(),
    }
    const runtime = createWordSearchRuntime({ exportService })
    const currentRuntime = {
      ...runtime,
      initialState: {
        ...runtime.initialState,
        settings: saved.settings,
        current: saved.result,
        status: 'ready' as const,
      },
    }
    render(
      <WordSearchProvider runtime={currentRuntime}>
        <SaveModal open onOpenChange={jest.fn()} />
      </WordSearchProvider>,
    )

    await user.click(screen.getByRole('checkbox', {
      name: 'Download both (with & without answers)',
    }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(exportService.exportCurrent).toHaveBeenCalledWith(expect.objectContaining({
      includeAnswers: true,
      includePuzzle: false,
    }))
  })
})
