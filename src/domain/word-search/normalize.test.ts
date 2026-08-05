import { normalizeWords } from './normalize'

describe('normalizeWords', () => {
  test('trims, removes blank entries, and expands German sharp s', () => {
    expect(normalizeWords([' Fußball ', '', '  '], 'de')).toEqual(['FUSSBALL'])
  })

  test('uses the language locale when uppercasing words', () => {
    expect(normalizeWords(['привет', 'ist'], 'ru')).toEqual(['ПРИВЕТ', 'IST'])
  })
})
