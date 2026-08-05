import {
  isWordSearchSettings,
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
    || parsed.version !== 1
    || !Object.prototype.hasOwnProperty.call(parsed, 'data')
    || !isWordSearchSettings(parsed.data)
  ) {
    return null
  }

  return parsed.data
}

function freshDefaults(): WordSearchSettings {
  return createInitialState().settings
}

/** Creates strict version-1 settings persistence with fresh-default recovery. */
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
        storage.setItem(key, JSON.stringify({ version: 1, data: settings }))
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
