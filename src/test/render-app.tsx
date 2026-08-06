import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import type { StorageAdapter } from '@/features/saved-generations/repository'
import { I18nProvider } from '@/i18n'
import {
  WordSearchProvider,
  createWordSearchRuntime,
  type WordSearchProviderDependencies,
} from '@/store'

if (globalThis.PointerEvent === undefined) {
  Object.defineProperty(globalThis, 'PointerEvent', {
    configurable: true,
    value: MouseEvent,
  })
}

if (globalThis.structuredClone === undefined) {
  globalThis.structuredClone = <T,>(value: T): T =>
    JSON.parse(JSON.stringify(value)) as T
}

function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: (key) => { values.delete(key) },
  }
}

/** Renders real application components through a deterministic provider runtime. */
export function renderWordSearch(
  ui: ReactElement,
  overrides: WordSearchProviderDependencies = {},
) {
  const runtime = createWordSearchRuntime({
    storage: createMemoryStorage(),
    random: () => 0,
    createId: () => 'saved-generation-id',
    now: () => 1_725_555_555_000,
    exportService: {
      exportCurrent: jest.fn(async () => ({ ok: true as const })),
      exportSaved: jest.fn(async () => ({ ok: true as const })),
    },
    ...overrides,
  })

  return {
    user: userEvent.setup(),
    runtime,
    ...render(
      <I18nProvider>
        <WordSearchProvider runtime={runtime}>
          {ui}
        </WordSearchProvider>
      </I18nProvider>,
    ),
  }
}
