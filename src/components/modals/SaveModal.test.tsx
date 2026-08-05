import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SavedGeneration } from '@/features/saved-generations/types'
import { WordSearchProvider } from '@/store/WordSearchProvider'
import { SaveModal } from './SaveModal'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

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

describe('SaveModal', () => {
  beforeEach(() => window.localStorage.clear())

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
    render(
      <WordSearchProvider dependencies={{ exportService }}>
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
})
