import { DIRECTION_VECTORS } from '@/domain/word-search'
import type {
  Direction,
  Grid,
  WordPlacement,
  WordSearchResult,
} from '@/domain/word-search'
import type {
  Dimensions,
  WordSearchSettings,
} from '@/store/types'
import type { SavedGeneration } from './types'

const DEFAULT_STORAGE_KEY = 'word-search:saved-generations'
const DIRECTIONS = new Set<Direction>([
  'up',
  'down',
  'left',
  'right',
  'up-left',
  'up-right',
  'down-left',
  'down-right',
])
const CARDINAL_DIRECTIONS = new Set<Direction>(['up', 'down', 'left', 'right'])
const DIAGONAL_DIRECTIONS = new Set<Direction>([
  'up-left',
  'up-right',
  'down-left',
  'down-right',
])
const LANGUAGES = new Set(['en', 'ru', 'de'])
const GRID_STYLES = new Set(['full', 'outer', 'none'])
const OUTPUT_MODES = new Set(['natural', 'resolution', 'aspect-ratio'])

/** Minimal Web Storage surface used by persistence repositories. */
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface SavedGenerationsRepository {
  load(): SavedGeneration[]
  save(items: SavedGeneration[]): boolean
  clear(): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(value)
  return keys.length === expected.length && keys.every((key) => expected.includes(key))
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && isPositiveNumber(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && isFiniteNumber(value) && value >= 0
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isEnumMember(value: unknown, members: ReadonlySet<string>): value is string {
  return isString(value) && members.has(value)
}

function isDimensions(value: unknown): value is Dimensions {
  return isRecord(value)
    && hasExactKeys(value, ['width', 'height'])
    && isPositiveNumber(value.width)
    && isPositiveNumber(value.height)
}

function isDirectionArray(
  value: unknown,
  allowed: ReadonlySet<Direction>,
): value is Direction[] {
  return Array.isArray(value)
    && value.every((direction) => isEnumMember(direction, allowed))
}

/** Validates the complete persisted settings shape without applying migrations. */
export function isWordSearchSettings(value: unknown): value is WordSearchSettings {
  if (!isRecord(value) || !hasExactKeys(value, ['generation', 'appearance', 'output'])) {
    return false
  }

  const { generation, appearance, output } = value
  if (!isRecord(generation)
    || !hasExactKeys(generation, [
      'words',
      'language',
      'width',
      'height',
      'cardinalDirections',
      'diagonalDirections',
    ])
    || !Array.isArray(generation.words)
    || !generation.words.every(isString)
    || !isEnumMember(generation.language, LANGUAGES)
    || !isPositiveInteger(generation.width)
    || !isPositiveInteger(generation.height)
    || !isDirectionArray(generation.cardinalDirections, CARDINAL_DIRECTIONS)
    || !isDirectionArray(generation.diagonalDirections, DIAGONAL_DIRECTIONS)
  ) {
    return false
  }

  if (!isRecord(appearance)
    || !hasExactKeys(appearance, [
      'highlightColor',
      'fontFamily',
      'fontSize',
      'gridStyle',
      'customFont',
      'localFont',
    ])
    || !isString(appearance.highlightColor)
    || !isString(appearance.fontFamily)
    || !isPositiveNumber(appearance.fontSize)
    || !isEnumMember(appearance.gridStyle, GRID_STYLES)
    || !isRecord(appearance.customFont)
    || !hasExactKeys(appearance.customFont, ['enabled', 'url'])
    || !isBoolean(appearance.customFont.enabled)
    || !isString(appearance.customFont.url)
    || !isRecord(appearance.localFont)
    || !hasExactKeys(appearance.localFont, ['enabled', 'family', 'fullName', 'style'])
    || !isBoolean(appearance.localFont.enabled)
    || !isString(appearance.localFont.family)
    || !isString(appearance.localFont.fullName)
    || !isString(appearance.localFont.style)
  ) {
    return false
  }

  return isRecord(output)
    && hasExactKeys(output, ['mode', 'resolution', 'aspectRatio'])
    && isEnumMember(output.mode, OUTPUT_MODES)
    && isDimensions(output.resolution)
    && isDimensions(output.aspectRatio)
}

function isGrid(value: unknown, width: number, height: number): value is Grid {
  return Array.isArray(value)
    && value.length === height
    && height > 0
    && value.every((row) => Array.isArray(row)
      && row.length === width
      && width > 0
      && row.every((cell) => isRecord(cell)
        && hasExactKeys(cell, ['letter'])
        && isString(cell.letter)))
}

function isPlacement(
  value: unknown,
  settings: WordSearchSettings,
): value is WordPlacement {
  if (!isRecord(value)
    || !hasExactKeys(value, ['x', 'y', 'wordIndex', 'direction', 'word'])
    || !isNonNegativeInteger(value.x)
    || !isNonNegativeInteger(value.y)
    || !isNonNegativeInteger(value.wordIndex)
    || value.wordIndex >= settings.generation.words.length
    || !isEnumMember(value.direction, DIRECTIONS)
    || !isString(value.word)
    || value.word.length === 0
  ) {
    return false
  }

  const vector = DIRECTION_VECTORS[value.direction as Direction]
  const wordLength = Array.from(value.word).length
  const endX = value.x + vector.x * (wordLength - 1)
  const endY = value.y + vector.y * (wordLength - 1)

  return value.x < settings.generation.width
    && value.y < settings.generation.height
    && endX >= 0
    && endY >= 0
    && endX < settings.generation.width
    && endY < settings.generation.height
}

function isWordSearchResult(
  value: unknown,
  settings: WordSearchSettings,
): value is WordSearchResult {
  if (!isRecord(value) || !hasExactKeys(value, ['puzzle', 'solution', 'placements'])) {
    return false
  }

  const { width, height } = settings.generation
  return isGrid(value.puzzle, width, height)
    && isGrid(value.solution, width, height)
    && Array.isArray(value.placements)
    && value.placements.every((placement) => isPlacement(placement, settings))
}

function isSavedGeneration(value: unknown): value is SavedGeneration {
  if (!isRecord(value)
    || !hasExactKeys(value, ['id', 'name', 'createdAt', 'settings', 'result'])
    || !isString(value.id)
    || value.id.length === 0
    || !isString(value.name)
    || value.name.trim().length === 0
    || !isNonNegativeInteger(value.createdAt)
    || !isWordSearchSettings(value.settings)
  ) {
    return false
  }

  return isWordSearchResult(value.result, value.settings)
}

function decodeEnvelope(raw: string): SavedGeneration[] | null {
  const parsed: unknown = JSON.parse(raw)
  if (!isRecord(parsed)
    || !hasExactKeys(parsed, ['version', 'data'])
    || parsed.version !== 1
    || !Array.isArray(parsed.data)
    || !parsed.data.every(isSavedGeneration)
  ) {
    return null
  }

  return parsed.data
}

/** Creates strict version-1 saved-generation persistence over Web Storage. */
export function createSavedGenerationsRepository(
  storage: StorageAdapter,
  key = DEFAULT_STORAGE_KEY,
): SavedGenerationsRepository {
  return {
    load() {
      try {
        const raw = storage.getItem(key)
        return raw === null ? [] : (decodeEnvelope(raw) ?? [])
      } catch {
        return []
      }
    },
    save(items) {
      try {
        storage.setItem(key, JSON.stringify({ version: 1, data: items }))
        return true
      } catch {
        return false
      }
    },
    clear() {
      storage.removeItem(key)
    },
  }
}
