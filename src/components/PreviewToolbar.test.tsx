import { fireEvent, screen } from '@testing-library/react'
import { renderWordSearch } from '@/test/render-app'
import { PreviewToolbar } from './PreviewToolbar'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

describe('PreviewToolbar', () => {
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
})
