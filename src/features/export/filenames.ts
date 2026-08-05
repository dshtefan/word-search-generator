const INVALID_FILENAME_CHARACTERS = /[\\/:*?"<>|]+/g
const RESERVED_WINDOWS_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i
const DEFAULT_FILENAME = 'word-search'

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

/** Produces a deterministic cross-platform filename stem without path segments. */
export function normalizeFilename(name: string, fallback: string): string {
  const candidate = sanitize(name) || sanitize(fallback) || DEFAULT_FILENAME
  return RESERVED_WINDOWS_NAME.test(candidate) ? `${candidate}-file` : candidate
}
