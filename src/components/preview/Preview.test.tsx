import { render, screen } from '@testing-library/react'
import type { StorageAdapter } from '@/features/saved-generations/repository'
import {
  WordSearchProvider,
  createWordSearchRuntime,
} from '@/store'
import { Preview } from './Preview'

jest.mock('jspdf', () => ({ jsPDF: jest.fn() }))

const storage: StorageAdapter = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

describe('Preview', () => {
  test.each([
    ['empty', []],
    ['non-rectangular', [[{ letter: 'A' }], []]],
  ] as const)('falls back safely for a %s generated grid', (_label, puzzle) => {
    const runtime = createWordSearchRuntime({ storage })
    const malformedRuntime = {
      ...runtime,
      initialState: {
        ...runtime.initialState,
        current: {
          puzzle,
          solution: puzzle,
          placements: [],
        },
        status: 'ready' as const,
      },
    }

    render(
      <WordSearchProvider runtime={malformedRuntime}>
        <Preview />
      </WordSearchProvider>,
    )

    expect(screen.getByText('Click Generate to create a word search')).toBeVisible()
  })
})
