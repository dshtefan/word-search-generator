import { render, screen } from '@testing-library/react'
import type { Grid, WordPlacement } from '@/domain/word-search'
import { WordSearchGrid } from './WordSearchGrid'

const grid: Grid = Array.from({ length: 3 }, () =>
  Array.from({ length: 3 }, () => ({ letter: 'A' })),
)
const placements: WordPlacement[] = [{
  x: 2,
  y: 0,
  wordIndex: 0,
  direction: 'down-left',
  word: 'CAT',
}]

describe('WordSearchGrid', () => {
  test('derives answer paths only from domain placements', () => {
    render(
      <WordSearchGrid
        grid={grid}
        placements={placements}
        fontFamily="Arial"
        fontSize={10}
        highlightColor="#123456"
        gridStyle="outer"
        showAnswers
        cellWidthOverride={10}
        cellHeightOverride={20}
      />,
    )

    const table = screen.getByRole('table')
    const line = document.querySelector('svg line')
    expect(table).not.toHaveAttribute('id')
    expect(table.querySelector('[data-word-index]')).toBeNull()
    expect(line).toHaveAttribute('x1', '25')
    expect(line).toHaveAttribute('y1', '10')
    expect(line).toHaveAttribute('x2', '5')
    expect(line).toHaveAttribute('y2', '50')
    expect(line).toHaveAttribute('stroke', '#123456')
  })

  test.each([
    ['empty', []],
    ['non-rectangular', [[{ letter: 'A' }], []]],
  ] as const)('does not render a %s grid', (_label, malformedGrid) => {
    render(
      <WordSearchGrid
        grid={malformedGrid}
        placements={[]}
        fontFamily="Arial"
        fontSize={10}
        highlightColor="#123456"
        gridStyle="outer"
        showAnswers={false}
      />,
    )

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
