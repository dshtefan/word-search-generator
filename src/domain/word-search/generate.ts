import { getPlacementCells } from './directions'
import { WordSearchError } from './errors'
import { getRandomLetter } from './letters'
import type {
  Cell,
  Direction,
  GenerationInput,
  Grid,
  RandomSource,
  WordPlacement,
  WordSearchResult,
} from './types'
import { validateGenerationInput } from './validate'

const DEFAULT_MAX_ATTEMPTS = 10_000

interface MutableCell {
  letter: string
}

interface CellSnapshot {
  readonly x: number
  readonly y: number
  readonly cell: MutableCell
}

interface NormalizedWord {
  readonly word: string
  readonly letters: readonly string[]
  readonly originalIndex: number
}

interface PlacementCandidate {
  readonly x: number
  readonly y: number
  readonly direction: Direction
  readonly crowdingScore: number
  readonly overlapCount: number
}

/** Controls randomness and the amount of backtracking permitted during generation. */
export interface GenerateWordSearchOptions {
  /** Pseudo-random source used for candidate ordering and filler letters. Defaults to `Math.random`. */
  readonly random?: RandomSource
  /** Finite, non-negative integer candidate limit. Defaults to 10,000. */
  readonly maxAttempts?: number
}

function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const shuffled = [...values]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function createEmptyGrid(width: number, height: number): MutableCell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ letter: '' })),
  )
}

function getNormalizedWords(
  input: GenerationInput,
  words: readonly string[],
): NormalizedWord[] {
  let normalizedIndex = 0

  return input.words.flatMap((rawWord, originalIndex) => {
    if (rawWord.trim().length === 0) return []

    const word = words[normalizedIndex]
    normalizedIndex += 1
    return [{ word, letters: Array.from(word), originalIndex }]
  })
}

function isInBounds(
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  return x >= 0 && x < width && y >= 0 && y < height
}

function getCandidates(
  word: NormalizedWord,
  grid: readonly (readonly MutableCell[])[],
  directions: readonly Direction[],
  directionUsage: Readonly<Record<Direction, number>>,
  random: RandomSource,
): PlacementCandidate[] {
  const height = grid.length
  const width = grid[0].length
  const cells = Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }))
  const candidates: PlacementCandidate[] = []
  const shuffledDirections = shuffle(directions, random)

  for (const start of shuffle(cells, random)) {
    for (const direction of shuffledDirections) {
      const placementCells = getPlacementCells(start, direction, word.letters.length)
      if (placementCells.some(({ x, y }) => !isInBounds(x, y, width, height))) {
        continue
      }

      let overlapCount = 0
      let compatible = true
      for (let index = 0; index < placementCells.length; index += 1) {
        const { x, y } = placementCells[index]
        const existingLetter = grid[y][x].letter
        if (existingLetter !== '' && existingLetter !== word.letters[index]) {
          compatible = false
          break
        }
        if (existingLetter === word.letters[index]) overlapCount += 1
      }

      if (compatible) {
        const crowdingScore = placementCells.reduce((total, cell) => {
          let occupiedCells = 0
          for (let y = Math.max(0, cell.y - 1); y <= Math.min(height - 1, cell.y + 1); y += 1) {
            for (let x = Math.max(0, cell.x - 1); x <= Math.min(width - 1, cell.x + 1); x += 1) {
              if (grid[y][x].letter !== '') occupiedCells += 1
            }
          }
          return total + occupiedCells
        }, 0)
        candidates.push({ ...start, direction, crowdingScore, overlapCount })
      }
    }
  }

  return candidates.sort((left, right) =>
    left.crowdingScore - right.crowdingScore
    || directionUsage[left.direction] - directionUsage[right.direction]
    || right.overlapCount - left.overlapCount,
  )
}

function placeWord(
  word: NormalizedWord,
  candidate: PlacementCandidate,
  grid: MutableCell[][],
): CellSnapshot[] {
  return getPlacementCells(candidate, candidate.direction, word.letters.length)
    .map(({ x, y }, index) => {
      const snapshot = { x, y, cell: { ...grid[y][x] } }
      grid[y][x] = { letter: word.letters[index] }
      return snapshot
    })
}

function restoreCells(snapshots: readonly CellSnapshot[], grid: MutableCell[][]): void {
  for (const { x, y, cell } of snapshots) {
    grid[y][x] = { ...cell }
  }
}

function copyGrid(grid: readonly (readonly MutableCell[])[]): Grid {
  return grid.map((row) => row.map(({ letter }): Cell => ({ letter })))
}

/**
 * Generates a normalized word-search puzzle using randomized, longest-first backtracking.
 *
 * The supplied input and its arrays are never mutated. Supplying a repeatable random source
 * produces repeatable placements and filler letters.
 *
 * @throws {WordSearchError} If the input is invalid or the placement search is exhausted.
 */
export function generateWordSearch(
  input: GenerationInput,
  options: GenerateWordSearchOptions = {},
): WordSearchResult {
  const normalizedWords = validateGenerationInput(input)

  const random = options.random ?? Math.random
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  if (!Number.isFinite(maxAttempts) || !Number.isInteger(maxAttempts) || maxAttempts < 0) {
    throw new WordSearchError(
      'PLACEMENT_EXHAUSTED',
      'maxAttempts must be a finite, non-negative integer',
    )
  }
  const words = getNormalizedWords(input, normalizedWords)
    .sort((left, right) =>
      right.letters.length - left.letters.length
      || left.originalIndex - right.originalIndex,
    )
  const grid = createEmptyGrid(input.width, input.height)
  const placements: WordPlacement[] = []
  const directionUsage = Object.fromEntries(
    input.directions.map((direction) => [direction, 0]),
  ) as Record<Direction, number>
  let attempts = 0

  function backtrack(wordIndex: number): boolean {
    if (wordIndex === words.length) return true

    const word = words[wordIndex]
    const candidates = getCandidates(
      word,
      grid,
      input.directions,
      directionUsage,
      random,
    )

    for (const candidate of candidates) {
      if (attempts >= maxAttempts) {
        throw new WordSearchError(
          'PLACEMENT_EXHAUSTED',
          `Maximum placement attempts (${maxAttempts}) exceeded`,
        )
      }
      attempts += 1

      const snapshots = placeWord(word, candidate, grid)
      directionUsage[candidate.direction] += 1
      placements.push({
        x: candidate.x,
        y: candidate.y,
        wordIndex: word.originalIndex,
        direction: candidate.direction,
        word: word.word,
      })

      if (backtrack(wordIndex + 1)) return true

      placements.pop()
      directionUsage[candidate.direction] -= 1
      restoreCells(snapshots, grid)
    }

    return false
  }

  if (!backtrack(0)) {
    throw new WordSearchError(
      'PLACEMENT_EXHAUSTED',
      'Could not place every word in the selected grid',
    )
  }

  for (const row of grid) {
    for (const cell of row) {
      if (cell.letter === '') cell.letter = getRandomLetter(input.language, random)
    }
  }

  return {
    puzzle: copyGrid(grid),
    solution: copyGrid(grid),
    placements: placements.map((placement) => ({ ...placement })),
  }
}
