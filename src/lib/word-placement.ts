import type { Cell, Direction, Language, WordPlacement } from '../types'
import { getRandomLetter } from './letter-frequencies'

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

interface PlacementAttempt {
  startX: number
  startY: number
  direction: Direction
  overlapCount: number
  crowdingScore: number
}

interface CellSnapshot {
  x: number
  y: number
  letter: string
  isPartOfWord: boolean
  wordIndex: number | null
}

const MAX_ATTEMPTS = 10000

function createEmptyGrid(gridX: number, gridY: number): Cell[][] {
  return Array.from({ length: gridY }, () =>
    Array.from({ length: gridX }, (): Cell => ({
      letter: '',
      isPartOfWord: false,
      wordIndex: null,
    }))
  )
}

function snapshotCell(x: number, y: number, grid: Cell[][]): CellSnapshot {
  const c = grid[y][x]
  return { x, y, letter: c.letter, isPartOfWord: c.isPartOfWord, wordIndex: c.wordIndex }
}

function restoreCell(snap: CellSnapshot, grid: Cell[][]): void {
  const c = grid[snap.y][snap.x]
  c.letter = snap.letter
  c.isPartOfWord = snap.isPartOfWord
  c.wordIndex = snap.wordIndex
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function countNeighborFill(
  x: number, y: number, dx: number, dy: number, wordLen: number,
  grid: Cell[][], gridX: number, gridY: number
): number {
  let count = 0
  for (let i = 0; i < wordLen; i++) {
    const cx = x + i * dx
    const cy = y + i * dy
    for (let ny = Math.max(0, cy - 1); ny <= Math.min(gridY - 1, cy + 1); ny++) {
      for (let nx = Math.max(0, cx - 1); nx <= Math.min(gridX - 1, cx + 1); nx++) {
        if (grid[ny][nx].letter !== '') count++
      }
    }
  }
  return count
}

function getPossiblePlacements(
  word: string,
  grid: Cell[][],
  gridX: number,
  gridY: number,
  directions: Direction[],
  directionUsage?: Record<string, number>
): PlacementAttempt[] {
  const placements: PlacementAttempt[] = []
  const usageMap = directionUsage ?? {}

  const cellOrder: [number, number][] = []
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      cellOrder.push([x, y])
    }
  }
  const shuffledCells = shuffleArray(cellOrder)

  const shuffledDirs = shuffleArray(directions)

  for (const [x, y] of shuffledCells) {
    for (const dir of shuffledDirs) {
      const { dx, dy } = DIRECTION_OFFSETS[dir]
      const endX = x + (word.length - 1) * dx
      const endY = y + (word.length - 1) * dy

      if (endX < 0 || endX >= gridX || endY < 0 || endY >= gridY) continue

      let overlaps = 0
      let compatible = true

      for (let i = 0; i < word.length; i++) {
        const cx = x + i * dx
        const cy = y + i * dy
        const cell = grid[cy][cx]

        if (cell.letter !== '' && cell.letter !== word[i]) {
          compatible = false
          break
        }

        if (cell.letter === word[i]) {
          overlaps++
        }
      }

      if (compatible) {
        const crowding = countNeighborFill(x, y, dx, dy, word.length, grid, gridX, gridY)
        placements.push({ startX: x, startY: y, direction: dir, overlapCount: overlaps, crowdingScore: crowding })
      }
    }
  }

  placements.sort((a, b) => {
    const ca = a.crowdingScore + (usageMap[a.direction] ?? 0) * 3
    const cb = b.crowdingScore + (usageMap[b.direction] ?? 0) * 3
    if (ca !== cb) return ca - cb
    return Math.random() - 0.5
  })
  return placements
}

function placeWord(
  word: string,
  wordIndex: number,
  startX: number,
  startY: number,
  direction: Direction,
  grid: Cell[][]
): CellSnapshot[] {
  const { dx, dy } = DIRECTION_OFFSETS[direction]
  const snapshots: CellSnapshot[] = []

  for (let i = 0; i < word.length; i++) {
    const x = startX + i * dx
    const y = startY + i * dy

    snapshots.push(snapshotCell(x, y, grid))

    grid[y][x].letter = word[i]
    grid[y][x].isPartOfWord = true
    grid[y][x].wordIndex = wordIndex
  }

  return snapshots
}

function removeWord(snapshots: CellSnapshot[], grid: Cell[][]): void {
  for (const snap of snapshots) {
    restoreCell(snap, grid)
  }
}

function fillEmptyCells(grid: Cell[][], gridX: number, gridY: number, language: Language): void {
  for (let y = 0; y < gridY; y++) {
    for (let x = 0; x < gridX; x++) {
      if (grid[y][x].letter === '') {
        grid[y][x].letter = getRandomLetter(language)
      }
    }
  }
}

function buildOutputGrids(workingGrid: Cell[][]): { grid: Cell[][]; solutionGrid: Cell[][] } {
  const solutionGrid = structuredClone(workingGrid)

  const grid = structuredClone(workingGrid)
  for (const row of grid) {
    for (const cell of row) {
      cell.isPartOfWord = false
      cell.wordIndex = null
    }
  }

  return { grid, solutionGrid }
}

export function generateGrid(
  words: string[],
  directions: Direction[],
  gridX: number,
  gridY: number,
  language: Language
): { grid: Cell[][]; solutionGrid: Cell[][]; placements: WordPlacement[] } {
  if (words.length === 0) throw new Error('At least one word is required')
  if (directions.length === 0) throw new Error('At least one direction must be selected')
  if (words.some(w => w.length === 0)) throw new Error('Words cannot be empty strings')

  const upperWords = words.map(w => w.toUpperCase())
  const longestLen = Math.max(...upperWords.map(w => w.length))
  if (longestLen > Math.max(gridX, gridY)) {
    throw new Error(`Longest word (${longestLen} chars) does not fit in ${gridX}x${gridY} grid`)
  }

  const wordList = [...upperWords].map((word, originalIndex) => ({ word, originalIndex }))
  const shuffledWords = shuffleArray(wordList)

  const workingGrid = createEmptyGrid(gridX, gridY)
  const directionUsage: Record<string, number> = {}
  for (const d of directions) directionUsage[d] = 0
  let attempts = 0
  const collectedPlacements: WordPlacement[] = []

  function backtrack(index: number): boolean {
    if (index >= shuffledWords.length) return true

    const { word, originalIndex } = shuffledWords[index]
    const placements = getPossiblePlacements(word, workingGrid, gridX, gridY, directions, directionUsage)

    for (const placement of placements) {
      if (attempts >= MAX_ATTEMPTS) {
        throw new Error('Maximum placement attempts exceeded — grid may be too small')
      }
      attempts++

      const snapshots = placeWord(
        word,
        originalIndex,
        placement.startX,
        placement.startY,
        placement.direction,
        workingGrid
      )

      directionUsage[placement.direction]++
      collectedPlacements.push({ index: originalIndex, startX: placement.startX, startY: placement.startY, direction: placement.direction })

      if (backtrack(index + 1)) return true

      directionUsage[placement.direction]--
      collectedPlacements.pop()
      removeWord(snapshots, workingGrid)
    }

    return false
  }

  if (!backtrack(0)) {
    const failedWord = shuffledWords.find(({ word: w }) => {
      const placements = getPossiblePlacements(w, workingGrid, gridX, gridY, directions)
      return placements.length === 0
    })
    const wordName = failedWord ? failedWord.word : shuffledWords[shuffledWords.length - 1].word
    throw new Error(`Could not place word "${wordName}" — try a larger grid or fewer words`)
  }

  fillEmptyCells(workingGrid, gridX, gridY, language)

  const { grid, solutionGrid } = buildOutputGrids(workingGrid)
  return { grid, solutionGrid, placements: collectedPlacements }
}
