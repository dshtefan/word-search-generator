import { useMemo } from 'react'
import { getPlacementEnd } from '@/domain/word-search'
import type { Grid, GridStyle, WordPlacement } from '@/domain/word-search'

interface WordPath {
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
}

interface WordSearchGridProps {
  grid: Grid
  placements: readonly WordPlacement[]
  fontFamily: string
  fontSize: number
  highlightColor: string
  gridStyle: GridStyle
  showAnswers: boolean
  cellWidthOverride?: number
  cellHeightOverride?: number
  fontStyle?: string
  fontWeight?: string | number
}

function buildWordPaths(
  placements: readonly WordPlacement[],
  cellWidth: number,
  cellHeight: number,
): WordPath[] {
  return placements.map((placement) => {
    const end = getPlacementEnd(
      placement,
      placement.direction,
      Array.from(placement.word).length,
    )
    return {
      x1: placement.x * cellWidth + cellWidth / 2,
      y1: placement.y * cellHeight + cellHeight / 2,
      x2: end.x * cellWidth + cellWidth / 2,
      y2: end.y * cellHeight + cellHeight / 2,
    }
  })
}

/** Renders a generated grid and an optional placement-derived SVG answer overlay. */
export function WordSearchGrid({
  grid,
  placements,
  fontFamily,
  fontSize,
  highlightColor,
  gridStyle,
  showAnswers,
  cellWidthOverride,
  cellHeightOverride,
  fontStyle,
  fontWeight,
}: WordSearchGridProps) {
  const cellWidth = cellWidthOverride ?? fontSize + 8
  const cellHeight = cellHeightOverride ?? fontSize + 8
  const wordPaths = useMemo(() => showAnswers
    ? buildWordPaths(placements, cellWidth, cellHeight)
    : [], [cellHeight, cellWidth, placements, showAnswers])
  const rows = grid.length
  const columns = grid[0].length
  const tableClassName = gridStyle === 'full'
    ? 'border-collapse'
    : gridStyle === 'outer'
      ? 'border-2 border-gray-400'
      : ''
  const cellClassName = gridStyle === 'full' ? 'border border-gray-300' : ''
  const borderOffset = gridStyle === 'outer' ? 2 : 0

  return (
    <div className="relative inline-block">
      <table
        data-grid-style={gridStyle}
        data-highlight-color={highlightColor}
        className={tableClassName}
      >
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, columnIndex) => (
                <td
                  key={columnIndex}
                  className={`text-center align-middle ${cellClassName}`}
                  style={{
                    fontFamily,
                    fontSize: `${fontSize}px`,
                    width: cellWidth,
                    height: cellHeight,
                    ...(fontWeight === undefined ? {} : { fontWeight }),
                    ...(fontStyle ? { fontStyle } : {}),
                  }}
                >
                  {cell.letter}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {wordPaths.length > 0 && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ top: borderOffset, left: borderOffset }}
          width={columns * cellWidth}
          height={rows * cellHeight}
        >
          {wordPaths.map((path, index) => (
            <line
              key={index}
              x1={path.x1}
              y1={path.y1}
              x2={path.x2}
              y2={path.y2}
              stroke={highlightColor}
              strokeWidth={Math.min(cellWidth, cellHeight) * 0.7}
              strokeLinecap="round"
              opacity={0.6}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
