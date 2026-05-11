import { useMemo } from 'react'
import type { Cell, WordPlacement, Direction } from '@/types'

interface WordPath {
  x1: number
  y1: number
  x2: number
  y2: number
}

const DIRECTION_OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  'up-left': { dx: -1, dy: -1 },
  'up-right': { dx: 1, dy: -1 },
  'down-left': { dx: -1, dy: 1 },
  'down-right': { dx: 1, dy: 1 },
}

function buildWordPaths(placements: WordPlacement[], cellW: number, cellH: number): WordPath[] {
  return placements.map((p) => {
    const len = p.wordText.length
    const { dx, dy } = DIRECTION_OFFSETS[p.direction]
    const ex = p.startX + (len - 1) * dx
    const ey = p.startY + (len - 1) * dy
    return {
      x1: p.startX * cellW + cellW / 2,
      y1: p.startY * cellH + cellH / 2,
      x2: ex * cellW + cellW / 2,
      y2: ey * cellH + cellH / 2,
    }
  })
}

interface WordSearchGridProps {
  grid: Cell[][] | null
  words: string[]
  placements: WordPlacement[]
  fontFamily: string
  fontSize: number
  highlightColor: string
  gridStyle: 'full' | 'outer' | 'none'
  showAnswers: boolean
  tableId?: string
  cellWidthOverride?: number
  cellHeightOverride?: number
  fontStyle?: string
  fontWeight?: string | number
}

export function WordSearchGrid({
  grid,
  words,
  placements,
  fontFamily,
  fontSize,
  highlightColor,
  gridStyle,
  showAnswers,
  tableId = 'word-search-grid',
  cellWidthOverride,
  cellHeightOverride,
  fontStyle,
  fontWeight,
}: WordSearchGridProps) {
  const cellW = cellWidthOverride ?? fontSize + 8
  const cellH = cellHeightOverride ?? fontSize + 8

  const wordPaths = useMemo(() => {
    if (!grid || !showAnswers || placements.length === 0) return []
    return buildWordPaths(placements, cellW, cellH)
  }, [grid, showAnswers, placements, words, cellW, cellH])

  if (!grid) return null

  const rows = grid.length
  const cols = grid[0].length
  const svgW = cols * cellW
  const svgH = rows * cellH

  const tableClassName =
    gridStyle === 'full'
      ? 'border-collapse'
      : gridStyle === 'outer'
        ? 'border-2 border-gray-400'
        : ''

  const cellClassName =
    gridStyle === 'full' ? 'border border-gray-300' : ''

  return (
    <div className="relative inline-block">
      <table id={tableId} data-grid-style={gridStyle} data-highlight-color={highlightColor} className={tableClassName}>
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  data-word-index={cell.wordIndex ?? undefined}
                  className={`text-center align-middle ${cellClassName}`}
                  style={{
                    fontFamily,
                    fontSize: fontSize + 'px',
                    width: cellW,
                    height: cellH,
                    ...(fontWeight !== undefined ? { fontWeight } : {}),
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
      {showAnswers && wordPaths.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0"
          width={svgW}
          height={svgH}
        >
          {wordPaths.map((wp, i) => (
            <line
              key={i}
              x1={wp.x1}
              y1={wp.y1}
              x2={wp.x2}
              y2={wp.y2}
              stroke={highlightColor}
              strokeWidth={Math.min(cellW, cellH) * 0.7}
              strokeLinecap="round"
              opacity={0.6}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
