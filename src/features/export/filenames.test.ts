/** @jest-environment node */

import { normalizeFilename } from './filenames'

describe('normalizeFilename', () => {
  test.each([
    ['../a:b', 'a-b'],
    ['unit/one\\two', 'unit-one-two'],
    ['A\u0000B\u001fC', 'A B C'],
    ['  Lesson \t  One  ', 'Lesson One'],
  ])('normalizes %j to the deterministic safe name %j', (name, expected) => {
    expect(normalizeFilename(name, 'word-search')).toBe(expected)
  })

  test('uses a normalized fallback for a blank name', () => {
    expect(normalizeFilename(' \t ', '  My / Puzzle  ')).toBe('My-Puzzle')
  })

  test('uses a stable default when both names sanitize to blank', () => {
    expect(normalizeFilename('..', '\u0000 / ')).toBe('word-search')
  })

  test.each(['CON', 'prn', 'LPT9.txt'])('avoids the reserved Windows name %s', (name) => {
    expect(normalizeFilename(name, 'word-search')).toBe(`${name}-file`)
  })

  test('limits the stem to 120 Unicode code points without splitting a character', () => {
    const normalized = normalizeFilename(`${'a'.repeat(119)}😀b`, 'word-search')

    expect([...normalized]).toHaveLength(120)
    expect(normalized.endsWith('😀')).toBe(true)
    expect(normalized).not.toContain('b')
  })
})
