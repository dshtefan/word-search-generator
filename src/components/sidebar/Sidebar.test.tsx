import { render, screen } from '@testing-library/react'
import { WordSearchProvider } from '@/store/WordSearchProvider'
import { Sidebar } from './Sidebar'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

describe('Sidebar', () => {
  beforeEach(() => window.localStorage.clear())

  test('preserves the existing card order and action labels', () => {
    render(
      <WordSearchProvider>
        <Sidebar />
      </WordSearchProvider>,
    )

    expect([...document.querySelectorAll('[data-slot="card-title"]')]
      .map(({ textContent }) => textContent)).toEqual([
      'Words',
      'Language',
      'Grid Size',
      'Highlight Color',
      'Directions',
      'Font',
      'Grid Style',
    ])
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save generation' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset to defaults' })).toBeEnabled()
  })
})
