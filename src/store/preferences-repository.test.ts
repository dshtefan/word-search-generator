/** @jest-environment node */

import { createInitialState } from './initial-state'
import { createPreferencesRepository } from './preferences-repository'

class MemoryStorage {
  readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

describe('createPreferencesRepository', () => {
  test('loads complete settings from a version-1 envelope', () => {
    const storage = new MemoryStorage()
    const settings = createInitialState().settings
    settings.generation.width = 24
    settings.appearance.fontSize = 36
    settings.output.mode = 'aspect-ratio'
    storage.values.set('preferences-key', JSON.stringify({ version: 1, data: settings }))

    expect(createPreferencesRepository(storage, 'preferences-key').load()).toEqual(settings)
  })

  test.each([
    ['missing content', null],
    ['invalid JSON', '{'],
    ['unsupported version', JSON.stringify({ version: 2, data: {} })],
    ['missing settings fields', JSON.stringify({ version: 1, data: { generation: {} } })],
    ['invalid settings enum', JSON.stringify({
      version: 1,
      data: {
        ...createInitialState().settings,
        output: { ...createInitialState().settings.output, mode: 'fixed' },
      },
    })],
  ])('returns fresh defaults for %s', (_label, raw) => {
    const storage = new MemoryStorage()
    if (raw !== null) {
      storage.values.set('preferences-key', raw)
    }
    const repository = createPreferencesRepository(storage, 'preferences-key')

    const first = repository.load()
    const second = repository.load()

    expect(first).toEqual(createInitialState().settings)
    expect(first).not.toBe(second)
    expect(first.generation.words).not.toBe(second.generation.words)
    expect(first.appearance.customFont).not.toBe(second.appearance.customFont)
    expect(first.output.resolution).not.toBe(second.output.resolution)
  })

  test('saves only settings in a version-1 envelope', () => {
    const storage = new MemoryStorage()
    const settings = createInitialState().settings

    expect(createPreferencesRepository(storage, 'preferences-key').save(settings)).toBe(true)
    expect(JSON.parse(storage.values.get('preferences-key') ?? '')).toEqual({
      version: 1,
      data: settings,
    })
  })

  test('returns false instead of throwing when storage rejects a write', () => {
    const storage = new MemoryStorage()
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }

    const repository = createPreferencesRepository(storage, 'preferences-key')

    expect(repository.save(createInitialState().settings)).toBe(false)
  })

  test('clear removes the preferences key', () => {
    const storage = new MemoryStorage()
    storage.values.set('preferences-key', '{}')

    createPreferencesRepository(storage, 'preferences-key').clear()

    expect(storage.values.has('preferences-key')).toBe(false)
  })
})
