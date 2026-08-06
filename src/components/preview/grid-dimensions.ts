import type { Grid } from '@/domain/word-search'

export interface GridDimensions {
  readonly columns: number
  readonly rows: number
}

/** Returns dimensions only for a non-empty rectangular grid. */
export function getGridDimensions(grid: Grid): GridDimensions | null {
  const columns = grid[0]?.length ?? 0
  if (columns === 0 || grid.some((row) => row.length !== columns)) return null
  return { columns, rows: grid.length }
}
