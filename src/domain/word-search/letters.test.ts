import { getRandomLetter } from './letters'

describe('getRandomLetter', () => {
  test('selects from the requested alphabet using the supplied random source', () => {
    expect(getRandomLetter('en', () => 0)).toBe('E')
    expect(getRandomLetter('de', () => 0.999999)).toBe('Ü')
    expect(getRandomLetter('ru', () => 0)).toMatch(/[А-ЯЁ]/u)
  })

  test('clamps random values outside the supported range', () => {
    expect(getRandomLetter('en', () => -1)).toBe('E')
    expect(getRandomLetter('de', () => 1)).toBe('Ü')
  })
})
