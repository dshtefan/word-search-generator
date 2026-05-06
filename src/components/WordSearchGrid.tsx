import { useMemo } from 'react'
import type { Cell } from '@/types'

interface WordPath {
  x1: number
  y1: number
  x2: number
  y2: number
}

function buildWordPaths(grid: Cell[][], cellSize: number): WordPath[] {
  const wordMap = new Map<number, { x: number; y: number }[]>()
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const idx = grid[y][x].wordIndex
      if (idx !== null) {
        if (!wordMap.has(idx)) wordMap.set(idx, [])
        wordMap.get(idx)!.push({ x, y })
      }
    }
  }
  const paths: WordPath[] = []
  for (const [, positions] of wordMap) {
    if (positions.length < 2) continue
    positions.sort((a, b) => (a.y - b.y) || (a.x - b.x))
    const s = positions[0]
    const e = positions[positions.length - 1]
    paths.push({
      x1: s.x * cellSize + cellSize / 2,
      y1: s.y * cellSize + cellSize / 2,
      x2: e.x * cellSize + cellSize / 2,
      y2: e.y * cellSize + cellSize / 2,
    })
  }
  return paths
}

interface WordSearchGridProps {
  grid: Cell[][] | null
  fontFamily: string
  fontSize: number
  highlightColor: string
  gridStyle: 'full' | 'outer' | 'none'
  showAnswers: boolean
  tableId?: string
}

export function WordSearchGrid({
  grid,
  fontFamily,
  fontSize,
  highlightColor,
  gridStyle,
  showAnswers,
  tableId = 'word-search-grid',
}: WordSearchGridProps) {
  const cellSize = fontSize + 8

  const wordPaths = useMemo(() => {
    if (!grid || !showAnswers) return []
    return buildWordPaths(grid, cellSize)
  }, [grid, showAnswers, cellSize])

  if (!grid) return null

  const rows = grid.length
  const cols = grid[0].length
  const svgW = cols * cellSize
  const svgH = rows * cellSize

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
                    width: cellSize,
                    height: cellSize,
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
              strokeWidth={cellSize * 0.7}
              strokeLinecap="round"
              opacity={0.6}
            />
          ))}
        </svg>
      )}
    </div>
  )
}
