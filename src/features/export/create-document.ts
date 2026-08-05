import { getPlacementEnd } from '@/domain/word-search'
import { parseFontStyle } from '@/shared/font-style'
import type {
  CreateExportDocumentOptions,
  ExportDocument,
  ExportDocumentSource,
  ExportFont,
} from './types'

interface Geometry {
  readonly width: number
  readonly height: number
}

function getDimensions(
  source: ExportDocumentSource,
  columns: number,
  rows: number,
): Geometry {
  const naturalCellSize = source.settings.appearance.fontSize + 8
  const naturalWidth = columns * naturalCellSize
  const naturalHeight = rows * naturalCellSize
  const output = source.settings.output

  if (output.mode === 'resolution') return output.resolution
  if (output.mode === 'natural') {
    return { width: naturalWidth, height: naturalHeight }
  }

  const targetRatio = output.aspectRatio.width / output.aspectRatio.height
  const naturalRatio = naturalWidth / naturalHeight
  return naturalRatio > targetRatio
    ? { width: naturalWidth, height: naturalWidth / targetRatio }
    : { width: naturalHeight * targetRatio, height: naturalHeight }
}

function getFont(source: ExportDocumentSource): ExportFont {
  const { appearance } = source.settings
  const parsed = appearance.localFont.enabled
    ? parseFontStyle(appearance.localFont.style)
    : {}

  return {
    family: appearance.fontFamily,
    size: appearance.fontSize,
    ...(parsed.fontStyle === undefined ? {} : { style: parsed.fontStyle }),
    ...(parsed.fontWeight === undefined ? {} : { weight: parsed.fontWeight }),
    ...(appearance.customFont.enabled && appearance.customFont.url.trim()
      ? { customUrl: appearance.customFont.url.trim() }
      : {}),
    ...(appearance.localFont.enabled && appearance.localFont.family.trim()
      ? { localFamily: appearance.localFont.family.trim() }
      : {}),
    ...(appearance.localFont.enabled && appearance.localFont.fullName.trim()
      ? { localFullName: appearance.localFont.fullName.trim() }
      : {}),
  }
}

/** Converts a saved domain snapshot into renderer-independent export geometry. */
export function createExportDocument(
  source: ExportDocumentSource,
  options: CreateExportDocumentOptions,
): ExportDocument {
  const grid = options.answers ? source.result.solution : source.result.puzzle
  const rows = grid.length
  const columns = grid[0].length
  const { width, height } = getDimensions(source, columns, rows)
  const cellWidth = width / columns
  const cellHeight = height / rows
  const cells = grid.flatMap((row, rowIndex) =>
    row.map((cell, columnIndex) => ({
      letter: cell.letter,
      x: columnIndex * cellWidth,
      y: rowIndex * cellHeight,
      width: cellWidth,
      height: cellHeight,
    })),
  )
  const paths = options.answers
    ? source.result.placements.map((placement) => {
        const end = getPlacementEnd(
          placement,
          placement.direction,
          [...placement.word].length,
        )
        return {
          wordIndex: placement.wordIndex,
          x1: placement.x * cellWidth + cellWidth / 2,
          y1: placement.y * cellHeight + cellHeight / 2,
          x2: end.x * cellWidth + cellWidth / 2,
          y2: end.y * cellHeight + cellHeight / 2,
          strokeWidth: Math.min(cellWidth, cellHeight) * 0.7,
        }
      })
    : []

  return {
    width,
    height,
    cells,
    paths,
    font: getFont(source),
    highlightColor: source.settings.appearance.highlightColor,
    gridStyle: source.settings.appearance.gridStyle,
  }
}
