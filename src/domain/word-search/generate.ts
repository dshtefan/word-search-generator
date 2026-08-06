import { DIRECTION_VECTORS, getPlacementCells } from './directions'
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
const DEFAULT_BALANCE = 50
const COMPLETE_OVERLAP_PENALTY = 1
const COLLINEAR_OVERLAP_PENALTY = 4

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
  readonly distributionScore: number
  readonly overlapCount: number
  readonly angularOverlapCount: number
}

/** Controls randomness and the amount of backtracking permitted during generation. */
export interface GenerateWordSearchOptions {
  /** Pseudo-random source used for candidate ordering and filler letters. Defaults to `Math.random`. */
  readonly random?: RandomSource
  /** Finite, non-negative integer candidate limit. Defaults to 10,000. */
  readonly maxAttempts?: number
  /** Soft preference for partial crossings, from 0 to 100. Defaults to 50. */
  readonly crossingPreference?: number
  /** Soft preference for distance from occupied cells, from 0 to 100. Defaults to 50. */
  readonly spreadStrength?: number
}

function normalizeBalance(value: number | undefined): number {
  if (value === undefined) return DEFAULT_BALANCE
  if (!Number.isFinite(value)) return DEFAULT_BALANCE
  return Math.min(100, Math.max(0, value))
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

function areDirectionsCollinear(left: Direction, right: Direction): boolean {
  const leftVector = DIRECTION_VECTORS[left]
  const rightVector = DIRECTION_VECTORS[right]
  return leftVector.x * rightVector.y === leftVector.y * rightVector.x
}

function getOccupiedDirections(
  placements: readonly WordPlacement[],
): ReadonlyMap<string, readonly Direction[]> {
  const directionsByCell = new Map<string, Direction[]>()
  for (const placement of placements) {
    for (const { x, y } of getPlacementCells(
      placement,
      placement.direction,
      Array.from(placement.word).length,
    )) {
      const coordinate = `${x},${y}`
      directionsByCell.set(coordinate, [
        ...(directionsByCell.get(coordinate) ?? []),
        placement.direction,
      ])
    }
  }
  return directionsByCell
}

function getDistributionScore(
  placementCells: readonly { readonly x: number; readonly y: number }[],
  grid: readonly (readonly MutableCell[])[],
  overlapCount: number,
  collinearOverlapCount: number,
  crossingPreference: number,
  spreadStrength: number,
): number {
  const placementCoordinates = new Set(
    placementCells.map(({ x, y }) => `${x},${y}`),
  )
  const height = grid.length
  const width = grid[0].length
  const neighboringOccupancy = placementCells.reduce((total, cell) => {
    let occupiedNeighbors = 0
    for (let y = Math.max(0, cell.y - 1); y <= Math.min(height - 1, cell.y + 1); y += 1) {
      for (let x = Math.max(0, cell.x - 1); x <= Math.min(width - 1, cell.x + 1); x += 1) {
        if (grid[y][x].letter !== '' && !placementCoordinates.has(`${x},${y}`)) {
          occupiedNeighbors += 1
        }
      }
    }
    return total + occupiedNeighbors
  }, 0)
  const neighboringDensity = neighboringOccupancy / placementCells.length
  const angularOverlapCount = overlapCount - collinearOverlapCount
  const isPartialCrossing = angularOverlapCount > 0
    && overlapCount < placementCells.length
  const crossingReward = isPartialCrossing
    ? angularOverlapCount * (crossingPreference / 25)
    : 0
  const completeOverlapPenalty = overlapCount === placementCells.length
    ? COMPLETE_OVERLAP_PENALTY
    : 0

  return neighboringDensity * (spreadStrength / 50)
    - crossingReward
    + collinearOverlapCount * COLLINEAR_OVERLAP_PENALTY
    + completeOverlapPenalty
}

function getCandidates(
  word: NormalizedWord,
  grid: readonly (readonly MutableCell[])[],
  directions: readonly Direction[],
  directionUsage: Readonly<Record<Direction, number>>,
  random: RandomSource,
  placements: readonly WordPlacement[],
  crossingPreference: number,
  spreadStrength: number,
): PlacementCandidate[] {
  const height = grid.length
  const width = grid[0].length
  const cells = Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
  }))
  const candidates: PlacementCandidate[] = []
  const shuffledDirections = shuffle(directions, random)
  const occupiedDirections = getOccupiedDirections(placements)

  for (const start of shuffle(cells, random)) {
    for (const direction of shuffledDirections) {
      const placementCells = getPlacementCells(start, direction, word.letters.length)
      if (placementCells.some(({ x, y }) => !isInBounds(x, y, width, height))) {
        continue
      }

      let overlapCount = 0
      let collinearOverlapCount = 0
      let compatible = true
      for (let index = 0; index < placementCells.length; index += 1) {
        const { x, y } = placementCells[index]
        const existingLetter = grid[y][x].letter
        if (existingLetter !== '' && existingLetter !== word.letters[index]) {
          compatible = false
          break
        }
        if (existingLetter === word.letters[index]) {
          overlapCount += 1
          const existingDirections = occupiedDirections.get(`${x},${y}`) ?? []
          if (existingDirections.some((existingDirection) =>
            areDirectionsCollinear(direction, existingDirection))) {
            collinearOverlapCount += 1
          }
        }
      }

      if (compatible) {
        const distributionScore = getDistributionScore(
          placementCells,
          grid,
          overlapCount,
          collinearOverlapCount,
          crossingPreference,
          spreadStrength,
        )
        candidates.push({
          ...start,
          direction,
          distributionScore,
          overlapCount,
          angularOverlapCount: overlapCount - collinearOverlapCount,
        })
      }
    }
  }

  return candidates.sort((left, right) =>
    left.distributionScore - right.distributionScore
    || directionUsage[left.direction] - directionUsage[right.direction]
    || (crossingPreference > 0
      ? right.angularOverlapCount - left.angularOverlapCount
      : 0),
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
  const crossingPreference = normalizeBalance(options.crossingPreference)
  const spreadStrength = normalizeBalance(options.spreadStrength)
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
      placements,
      crossingPreference,
      spreadStrength,
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
