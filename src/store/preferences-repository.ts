import {
  isWordSearchSettings,
  migrateLegacyWordSearchSettings,
  type StorageAdapter,
} from '@/features/saved-generations/repository'
import { createInitialState } from './initial-state'
import type { WordSearchSettings } from './types'

const DEFAULT_STORAGE_KEY = 'word-search:preferences'

interface PreferencesRepository {
  load(): WordSearchSettings
  save(settings: WordSearchSettings): boolean
  clear(): void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function decodeEnvelope(raw: string): WordSearchSettings | null {
  const parsed: unknown = JSON.parse(raw)
  if (!isRecord(parsed)
    || Object.keys(parsed).length !== 2
    || !Object.prototype.hasOwnProperty.call(parsed, 'data')
  ) {
    return null
  }

  if (parsed.version === 2) {
    return isWordSearchSettings(parsed.data) ? parsed.data : null
  }
  return parsed.version === 1
    ? migrateLegacyWordSearchSettings(parsed.data)
    : null
}

function freshDefaults(): WordSearchSettings {
  return createInitialState().settings
}

/** Creates version-2 settings persistence with version-1 migration. */
export function createPreferencesRepository(
  storage: StorageAdapter,
  key = DEFAULT_STORAGE_KEY,
): PreferencesRepository {
  return {
    load() {
      try {
        const raw = storage.getItem(key)
        return raw === null ? freshDefaults() : (decodeEnvelope(raw) ?? freshDefaults())
      } catch {
        return freshDefaults()
      }
    },
    save(settings) {
      try {
        storage.setItem(key, JSON.stringify({ version: 2, data: settings }))
        return true
      } catch {
        return false
      }
    },
    clear() {
      try {
        storage.removeItem(key)
      } catch {
        // Storage may be unavailable or blocked; clearing remains best-effort.
      }
    },
  }
}
