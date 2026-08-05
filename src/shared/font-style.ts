export interface ParsedFontStyle {
  fontStyle?: 'italic'
  fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
}

const WEIGHT_NAMES = [
  { names: ['extrabold', 'ultrabold'], weight: 800 },
  { names: ['semibold', 'demibold'], weight: 600 },
  { names: ['extralight', 'ultralight'], weight: 200 },
  { names: ['black', 'heavy'], weight: 900 },
  { names: ['bold'], weight: 700 },
  { names: ['medium'], weight: 500 },
  { names: ['regular', 'normal', 'book'], weight: 400 },
  { names: ['light'], weight: 300 },
  { names: ['thin'], weight: 100 },
] as const

/** Converts local-font metadata into CSS font style and numeric weight overrides. */
export function parseFontStyle(style: string): ParsedFontStyle {
  const normalized = style.toLowerCase().replace(/[\s_-]+/g, '')
  const parsed: ParsedFontStyle = {}

  if (normalized.includes('italic')) parsed.fontStyle = 'italic'

  const match = WEIGHT_NAMES.find(({ names }) =>
    names.some((name) => normalized.includes(name)),
  )
  if (match !== undefined) parsed.fontWeight = match.weight

  return parsed
}
