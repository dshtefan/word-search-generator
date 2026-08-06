import { fireEvent, screen } from '@testing-library/react'
import { renderWordSearch } from '@/test/render-app'
import { PreviewToolbar } from './PreviewToolbar'
import { Sidebar } from './sidebar/Sidebar'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

describe('PreviewToolbar', () => {
  beforeEach(() => window.localStorage.clear())

  test.each([
    ['Custom resolution', 0],
    ['Custom aspect ratio', 0],
  ])('clamps a negative %s input through the store boundary', async (
    checkboxName,
    inputIndex,
  ) => {
    const { user } = renderWordSearch(<PreviewToolbar />)
    await user.click(screen.getByRole('checkbox', { name: checkboxName }))
    const input = screen.getAllByRole('spinbutton')[inputIndex]

    fireEvent.change(input, { target: { value: '-1' } })

    expect(input).toHaveValue(1)
  })

  test('switches and persists the interface language independently', async () => {
    const first = renderWordSearch(
      <>
        <PreviewToolbar />
        <Sidebar />
      </>,
    )

    await first.user.selectOptions(
      screen.getByRole('combobox', { name: 'Interface language' }),
      'ru',
    )

    expect(screen.getByRole('combobox', { name: 'Язык интерфейса' })).toHaveTextContent(
      'Русский',
    )
    expect(screen.getByRole('button', { name: 'Сбросить размеры' })).toBeVisible()
    expect(screen.getByText('Слова')).toBeVisible()
    expect(screen.getByText('Баланс генерации')).toBeVisible()
    expect(window.localStorage.getItem('word-search:interface-locale')).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')

    const words = screen.getByRole('textbox', { name: 'Слова (по одному в строке)' })
    await first.user.clear(words)
    await first.user.type(words, '   ')
    await first.user.click(screen.getByRole('button', { name: 'Сгенерировать' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Нужно добавить хотя бы одно слово',
    )

    first.unmount()
    renderWordSearch(<PreviewToolbar />)

    expect(screen.getByRole('combobox', { name: 'Язык интерфейса' })).toHaveTextContent(
      'Русский',
    )
  })
})
