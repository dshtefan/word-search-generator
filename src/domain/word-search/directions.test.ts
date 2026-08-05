import { getPlacementCells, getPlacementEnd } from './directions'

test('enumerates a diagonal placement in order', () => {
  expect(getPlacementCells({ x: 3, y: 1 }, 'down-left', 3)).toEqual([
    { x: 3, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 3 },
  ])
  expect(getPlacementEnd({ x: 3, y: 1 }, 'down-left', 3)).toEqual({ x: 1, y: 3 })
})

test('rejects a negative placement length', () => {
  expect(() => getPlacementCells({ x: 0, y: 0 }, 'right', -1)).toThrow(RangeError)
})

test('rejects a negative placement length when finding its end', () => {
  expect(() => getPlacementEnd({ x: 0, y: 0 }, 'right', -1)).toThrow(RangeError)
})
