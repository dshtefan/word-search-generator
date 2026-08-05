const INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|]+/g
const RESERVED_WINDOWS_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i
const DEFAULT_FILENAME = 'word-search'
const MAX_FILENAME_CODE_POINTS = 120

function replaceControlCharacters(name: string): string {
  return [...name].map((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159)
      ? ' '
      : character
  }).join('')
}

function sanitize(name: string): string {
  return replaceControlCharacters(name.normalize('NFKC'))
    .replace(INVALID_FILENAME_CHARACTERS, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, '-')
    .trim()
    .replace(/^[. -]+|[. -]+$/g, '')
}

function truncate(name: string, maximum: number): string {
  return [...name].slice(0, maximum).join('').replace(/[. -]+$/g, '')
}

/** Produces a safe filename stem of at most 120 Unicode code points. */
export function normalizeFilename(name: string, fallback: string): string {
  const candidate = truncate(
    sanitize(name) || sanitize(fallback) || DEFAULT_FILENAME,
    MAX_FILENAME_CODE_POINTS,
  )
  return RESERVED_WINDOWS_NAME.test(candidate)
    ? `${truncate(candidate, MAX_FILENAME_CODE_POINTS - 5)}-file`
    : candidate
}
