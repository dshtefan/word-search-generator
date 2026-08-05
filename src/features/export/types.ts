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

export type ExportFormat = 'svg' | 'png' | 'pdf'

export interface CurrentExportRequest {
  readonly source: SavedGeneration
  readonly format: ExportFormat
  readonly filename: string
  readonly includeAnswers: boolean
  readonly includePuzzle: boolean
}

export interface SavedExportRequest {
  readonly snapshots: readonly SavedGeneration[]
  readonly format: ExportFormat
}

export type ExportResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string; readonly cause: unknown }

export interface ExportDimensions {
  readonly width: number
  readonly height: number
}

/** Raster output shared by PNG and PDF adapters. */
export interface RasterizedImage extends ExportDimensions {
  readonly blob: Blob
  readonly dataUrl: string
}

export type RasterizeSvg = (
  svg: string,
  dimensions: ExportDimensions,
) => Promise<RasterizedImage>

export type ExportBinaryAdapter = (
  svg: string,
  document: ExportDocument,
) => Promise<Blob>

export type BlobDownloadPort = (
  blob: Blob,
  filename: string,
) => void | Promise<void>

export interface ZipEntry {
  readonly filename: string
  readonly blob: Blob
}

export type ZipPackagingPort = (entries: readonly ZipEntry[]) => Promise<Blob>

export interface RasterImagePort {
  onload: (() => void) | null
  onerror: ((cause?: unknown) => void) | null
  src: string
}

export interface RasterCanvasContextPort {
  drawImage(
    image: RasterImagePort,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void
}

export interface RasterCanvasPort extends ExportDimensions {
  width: number
  height: number
  getContext(contextId: '2d'): RasterCanvasContextPort | null
  toBlob(callback: (blob: Blob | null) => void, type: 'image/png'): void
  toDataURL(type: 'image/png'): string
}

/** Minimal browser surface required to rasterize one SVG. */
export interface RasterizeBrowserPort {
  createCanvas(): RasterCanvasPort
  createImage(): RasterImagePort
  createObjectURL(blob: Blob): string
  revokeObjectURL(url: string): void
}

export interface ZipArchivePort {
  file(filename: string, blob: Blob): void
  generateBlob(): Promise<Blob>
}
