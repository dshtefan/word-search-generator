import type { GridStyle } from '@/domain/word-search'
import type { SavedGeneration } from '@/features/saved-generations/types'

export interface ExportCell {
  readonly letter: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface ExportPath {
  readonly wordIndex: number
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  readonly strokeWidth: number
}

/** Font attributes and optional external or installed face sources. */
export interface ExportFont {
  readonly family: string
  readonly size: number
  readonly style?: 'italic'
  readonly weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  readonly customUrl?: string
  readonly localFamily?: string
  readonly localFullName?: string
}

/** Pure rendering data shared by SVG, raster, and PDF export adapters. */
export interface ExportDocument {
  readonly width: number
  readonly height: number
  readonly cells: readonly ExportCell[]
  readonly paths: readonly ExportPath[]
  readonly font: ExportFont
  readonly highlightColor: string
  readonly gridStyle: GridStyle
}

/** Snapshot fields required to create an export document. */
export type ExportDocumentSource = Pick<SavedGeneration, 'settings' | 'result'>

/** Selects puzzle letters or the solution with answer paths. */
export interface CreateExportDocumentOptions {
  readonly answers: boolean
}
