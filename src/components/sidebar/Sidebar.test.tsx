import { fireEvent, render, screen } from '@testing-library/react'
import type { UserEvent } from '@testing-library/user-event'
import { WordSearchProvider } from '@/store'
import { Preview } from '@/components/preview/Preview'
import { renderWordSearch } from '@/test/render-app'
import { Sidebar } from './Sidebar'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

async function configureSmallGeneration(user: UserEvent, word = 'CAT') {
  const words = screen.getByRole('textbox', { name: 'Words (one per line)' })
  await user.clear(words)
  await user.type(words, word)
  const width = screen.getByRole('spinbutton', { name: 'Grid width' })
  await user.tripleClick(width)
  await user.keyboard('5')
  const height = screen.getByRole('spinbutton', { name: 'Grid height' })
  await user.tripleClick(height)
  await user.keyboard('5')

  const cardinal = screen.getByRole('button', { name: 'Cardinal directions' })
  await user.click(cardinal)
  await user.click(screen.getByRole('checkbox', { name: /Up$/ }))
  await user.click(screen.getByRole('checkbox', { name: /Down$/ }))
  await user.click(screen.getByRole('checkbox', { name: /Left$/ }))
  await user.click(cardinal)
  const diagonal = screen.getByRole('button', { name: 'Diagonal directions' })
  await user.click(diagonal)
  for (const name of [/Up-Left$/, /Up-Right$/, /Down-Left$/, /Down-Right$/]) {
    await user.click(screen.getByRole('checkbox', { name }))
  }
  await user.click(diagonal)
}

describe('Sidebar', () => {
  beforeEach(() => window.localStorage.clear())

  test('generates a visible puzzle and enables save actions from edited inputs', async () => {
    const { user } = renderWordSearch(
      <>
        <Sidebar />
        <Preview />
      </>,
    )

    await configureSmallGeneration(user)

    await user.click(screen.getByRole('button', { name: 'Generate' }))

    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(25)
    expect(cells.map((cell) => cell.textContent).join('')).toContain('CAT')
    expect(screen.getByRole('button', { name: 'Save generation' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  test('invalidates the preview and save actions when generation input changes', async () => {
    const { user } = renderWordSearch(
      <>
        <Sidebar />
        <Preview />
      </>,
    )
    await configureSmallGeneration(user)
    await user.click(screen.getByRole('button', { name: 'Generate' }))
    expect(screen.getAllByRole('cell')).toHaveLength(25)

    const words = screen.getByRole('textbox', { name: 'Words (one per line)' })
    await user.clear(words)
    await user.type(words, 'DOG')

    expect(screen.getByText('Click Generate to create a word search')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save generation' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  test('announces the mapped generation error for unusable words', async () => {
    const { user } = renderWordSearch(<Sidebar />)
    const words = screen.getByRole('textbox', { name: 'Words (one per line)' })
    await user.clear(words)
    await user.type(words, '   ')

    await user.click(screen.getByRole('button', { name: 'Generate' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'At least one word is required',
    )
  })

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
      'Generation Balance',
      'Font',
      'Grid Style',
    ])
    expect(screen.getByRole('button', { name: 'Generate' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save generation' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Reset to defaults' })).toBeEnabled()
  })

  test('exposes generation balance controls with neutral defaults', () => {
    render(
      <WordSearchProvider>
        <Sidebar />
      </WordSearchProvider>,
    )

    const crossing = screen.getByRole('slider', { name: 'Crossing preference' })
    const spread = screen.getByRole('slider', { name: 'Spread strength' })
    expect(crossing).toHaveValue('50')
    expect(spread).toHaveValue('50')

    fireEvent.change(crossing, { target: { value: '80' } })
    fireEvent.change(spread, { target: { value: '20' } })

    expect(crossing).toHaveValue('80')
    expect(spread).toHaveValue('20')
    expect(screen.getByText('80%')).toBeVisible()
    expect(screen.getByText('20%')).toBeVisible()
  })
})
