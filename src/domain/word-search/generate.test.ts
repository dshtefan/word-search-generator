import { getPlacementCells } from './directions'
import { generateWordSearch } from './index'
import type {
  Direction,
  GenerationInput,
  RandomSource,
  WordPlacement,
  WordSearchResult,
} from './types'

const zeroRandom: RandomSource = () => 0

const DIRECTION_DELTAS: Readonly<Record<Direction, readonly [number, number]>> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  'up-left': [-1, -1],
  'up-right': [1, -1],
  'down-left': [-1, 1],
  'down-right': [1, 1],
}

function placementLetters(
  result: WordSearchResult,
  placement: WordPlacement,
): string {
  const [dx, dy] = DIRECTION_DELTAS[placement.direction]
  return Array.from(placement.word, (_, index) =>
    result.solution[placement.y + dy * index][placement.x + dx * index].letter
  ).join('')
}

function sequenceRandom(values: readonly number[]): RandomSource {
  let index = 0
  return () => values[index++ % values.length]
}

test('places and records every normalized word', () => {
  const result = generateWordSearch({
    words: ['cat', 'art'],
    directions: ['right', 'down'],
    width: 5,
    height: 5,
    language: 'en',
  }, { random: zeroRandom })

  expect(result.placements.map((placement) => placement.word).sort()).toEqual([
    'ART',
    'CAT',
  ])
  for (const placement of result.placements) {
    const letters = getPlacementCells(
      placement,
      placement.direction,
      Array.from(placement.word).length,
    )
      .map(({ x, y }) => result.solution[y][x].letter)
      .join('')
    expect(letters).toBe(placement.word)
  }
})

test('returns separate puzzle and solution grids containing equal letters', () => {
  const result = generateWordSearch({
    words: ['cat'],
    directions: ['right'],
    width: 4,
    height: 3,
    language: 'en',
  }, { random: zeroRandom })

  expect(result.puzzle).toEqual(result.solution)
  expect(result.puzzle).not.toBe(result.solution)
  expect(result.puzzle[0]).not.toBe(result.solution[0])
  expect(result.puzzle[0][0]).not.toBe(result.solution[0][0])
})

test('does not mutate the input object or its arrays', () => {
  const words = Object.freeze([' cat ', 'art'])
  const directions = Object.freeze<Direction[]>(['right', 'down'])
  const input: GenerationInput = Object.freeze({
    words,
    directions,
    width: 5,
    height: 5,
    language: 'en',
  })
  const originalWords = [...words]
  const originalDirections = [...directions]

  generateWordSearch(input, { random: zeroRandom })

  expect(input.words).toEqual(originalWords)
  expect(input.directions).toEqual(originalDirections)
})

test.each(Object.entries(DIRECTION_DELTAS) as [Direction, readonly [number, number]][])(
  'places a word in the %s direction',
  (direction, [dx, dy]) => {
    const result = generateWordSearch({
      words: ['abc'],
      directions: [direction],
      width: 3,
      height: 3,
      language: 'en',
    }, { random: zeroRandom })
    const placement = result.placements[0]

    expect(placement.direction).toBe(direction)
    expect(placementLetters(result, placement)).toBe('ABC')
    expect(placement.x + dx * 2).toBeGreaterThanOrEqual(0)
    expect(placement.x + dx * 2).toBeLessThan(3)
    expect(placement.y + dy * 2).toBeGreaterThanOrEqual(0)
    expect(placement.y + dy * 2).toBeLessThan(3)
  },
)

test('preserves both words at identical-letter crossings', () => {
  const result = generateWordSearch({
    words: ['abc', 'cba'],
    directions: ['right', 'left'],
    width: 3,
    height: 1,
    language: 'en',
  }, { random: zeroRandom })

  expect(result.placements.map((placement) => placement.direction).sort()).toEqual([
    'left',
    'right',
  ])
  expect(result.placements.map((placement) => placementLetters(result, placement))).toEqual([
    'ABC',
    'CBA',
  ])
  const occupiedCoordinates = result.placements.map((placement) =>
    getPlacementCells(placement, placement.direction, 3)
      .map(({ x, y }) => `${x},${y}`)
      .sort(),
  )
  expect(occupiedCoordinates[0]).toEqual(['0,0', '1,0', '2,0'])
  expect(occupiedCoordinates[1]).toEqual(['0,0', '1,0', '2,0'])
})

test('restores cells while backtracking from an incompatible early placement', () => {
  const result = generateWordSearch({
    words: ['ab', 'ac', 'bc'],
    directions: ['right', 'down'],
    width: 2,
    height: 2,
    language: 'en',
  }, { random: zeroRandom })

  expect(result.placements.map((placement) => placementLetters(result, placement))).toEqual([
    'AB',
    'AC',
    'BC',
  ])
})

test('fills unused cells with letters from the selected language', () => {
  const result = generateWordSearch({
    words: ['a'],
    directions: ['right'],
    width: 2,
    height: 2,
    language: 'de',
  }, { random: () => 0.999999 })
  const placement = result.placements[0]

  for (let y = 0; y < 2; y += 1) {
    for (let x = 0; x < 2; x += 1) {
      if (x !== placement.x || y !== placement.y) {
        expect(result.puzzle[y][x].letter).toBe('Ü')
      }
    }
  }
})

test('is deterministic when supplied the same random sequence', () => {
  const input: GenerationInput = {
    words: ['planet', 'plate', 'net'],
    directions: ['right', 'down', 'down-right'],
    width: 8,
    height: 8,
    language: 'en',
  }
  const values = [0.13, 0.91, 0.42, 0.67, 0.05]

  const first = generateWordSearch(input, { random: sequenceRandom(values) })
  const second = generateWordSearch(input, { random: sequenceRandom(values) })

  expect(second).toEqual(first)
})

test('places longest words first while retaining stable original indices', () => {
  const result = generateWordSearch({
    words: [' a ', '', 'dog', 'cat'],
    directions: ['right', 'down'],
    width: 6,
    height: 6,
    language: 'en',
  }, { random: zeroRandom })

  expect(result.placements.map(({ word }) => word)).toEqual(['DOG', 'CAT', 'A'])
  expect(result.placements.map(({ wordIndex }) => wordIndex)).toEqual([2, 3, 0])
})

test('balances placement direction usage', () => {
  const directions = Object.keys(DIRECTION_DELTAS) as Direction[]
  const result = generateWordSearch({
    words: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    directions,
    width: 4,
    height: 4,
    language: 'en',
  }, { random: zeroRandom })

  expect(new Set(result.placements.map(({ direction }) => direction))).toEqual(
    new Set(directions),
  )
})

test('throws PLACEMENT_EXHAUSTED when maxAttempts is reached', () => {
  expect(() => generateWordSearch({
    words: ['ab', 'cd'],
    directions: ['right'],
    width: 2,
    height: 2,
    language: 'en',
  }, { random: zeroRandom, maxAttempts: 1 })).toThrow(
    expect.objectContaining({ code: 'PLACEMENT_EXHAUSTED' }),
  )
})

test.each([NaN, Infinity, -1, 1.5])(
  'rejects an invalid maxAttempts value of %p',
  (maxAttempts) => {
    expect(() => generateWordSearch({
      words: ['ab'],
      directions: ['right'],
      width: 2,
      height: 1,
      language: 'en',
    }, { random: zeroRandom, maxAttempts })).toThrow(
      expect.objectContaining({ code: 'PLACEMENT_EXHAUSTED' }),
    )
  },
)
