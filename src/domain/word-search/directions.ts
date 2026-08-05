import type { Direction, Point } from './types'

/** Maps each placement direction to its one-character coordinate delta. */
export const DIRECTION_VECTORS: Readonly<Record<Direction, Point>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  'up-left': { x: -1, y: -1 },
  'up-right': { x: 1, y: -1 },
  'down-left': { x: -1, y: 1 },
  'down-right': { x: 1, y: 1 },
}

/** Returns every coordinate occupied by a placement, in its character order. */
export function getPlacementCells(
  start: Point,
  direction: Direction,
  length: number,
): Point[] {
  if (length < 0) {
    throw new RangeError('Placement length cannot be negative')
  }

  const vector = DIRECTION_VECTORS[direction]
  return Array.from({ length }, (_, index) => ({
    x: start.x + vector.x * index,
    y: start.y + vector.y * index,
  }))
}

/** Returns the coordinate occupied by the final character of a placement. */
export function getPlacementEnd(
  start: Point,
  direction: Direction,
  length: number,
): Point {
  if (length < 0) {
    throw new RangeError('Placement length cannot be negative')
  }

  const vector = DIRECTION_VECTORS[direction]
  return {
    x: start.x + vector.x * (length - 1),
    y: start.y + vector.y * (length - 1),
  }
}
