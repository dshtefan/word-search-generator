import { parseFontStyle } from './font-style'

describe('parseFontStyle', () => {
  test.each([
    ['Thin', 100],
    ['ExtraLight', 200],
    ['Light', 300],
    ['Regular', 400],
    ['Medium', 500],
    ['SemiBold', 600],
    ['Bold', 700],
    ['ExtraBold', 800],
    ['Black', 900],
  ] as const)('parses %s as weight %i', (style, fontWeight) => {
    expect(parseFontStyle(style)).toEqual({ fontWeight })
  })

  test('parses italic independently of a specific weight', () => {
    expect(parseFontStyle('Extra Bold Italic')).toEqual({
      fontStyle: 'italic',
      fontWeight: 800,
    })
    expect(parseFontStyle('italic')).toEqual({ fontStyle: 'italic' })
  })

  test('supports case-insensitive common weight aliases', () => {
    expect(parseFontStyle('ULTRA LIGHT')).toEqual({ fontWeight: 200 })
    expect(parseFontStyle('heavy')).toEqual({ fontWeight: 900 })
  })

  test('returns no overrides for an unrecognized style', () => {
    expect(parseFontStyle('')).toEqual({})
    expect(parseFontStyle('Condensed')).toEqual({})
  })
})
