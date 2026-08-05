import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SystemFontPicker } from './SystemFontPicker'

describe('SystemFontPicker', () => {
  const originalQueryLocalFonts = (window as unknown as {
    queryLocalFonts?: unknown
  }).queryLocalFonts

  afterEach(() => {
    Object.defineProperty(window, 'queryLocalFonts', {
      configurable: true,
      value: originalQueryLocalFonts,
    })
  })

  test('reports unsupported local-font access without changing the picker control', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, 'queryLocalFonts', {
      configurable: true,
      value: undefined,
    })
    render(<SystemFontPicker value="" onChange={jest.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Choose a system font...' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'System font access is not available in this browser.',
    )
    expect(screen.getByRole('button', { name: 'Refresh system fonts' })).toBeEnabled()
  })

  test('reports permission rejection and always clears loading state', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, 'queryLocalFonts', {
      configurable: true,
      value: jest.fn().mockRejectedValue(new Error('denied')),
    })
    render(<SystemFontPicker value="" onChange={jest.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Choose a system font...' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to access system fonts.',
    )
    expect(screen.queryByText('Loading fonts...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh system fonts' })).toBeEnabled()
  })
})
