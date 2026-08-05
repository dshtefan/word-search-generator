import { createExportDocument } from './create-document'
import { downloadBlob, packageZip } from './download'
import { exportPdf } from './export-pdf'
import { normalizeFilename } from './filenames'
import { exportPng } from './export-png'
import { renderSvg } from './render-svg'
import type {
  BlobDownloadPort,
  CurrentExportRequest,
  ExportBinaryAdapter,
  ExportDocument,
  ExportFormat,
  ExportResult,
  SavedExportRequest,
  ZipEntry,
  ZipPackagingPort,
} from './types'

interface ExportServiceDependencies {
  readonly renderDocument?: (document: ExportDocument) => string
  readonly exportPng?: ExportBinaryAdapter
  readonly exportPdf?: ExportBinaryAdapter
  readonly downloadBlob?: BlobDownloadPort
  readonly packageZip?: ZipPackagingPort
}

interface ExportService {
  exportCurrent(request: CurrentExportRequest): Promise<ExportResult>
  exportSaved(request: SavedExportRequest): Promise<ExportResult>
}

interface Variant {
  readonly answers: boolean
  readonly suffix: string
}

function createFailure(message: string, cause: unknown): ExportResult {
  return { ok: false, message, cause }
}

function getCurrentVariants(request: CurrentExportRequest): Variant[] {
  const both = request.includeAnswers && request.includePuzzle
  return [
    ...(request.includeAnswers
      ? [{ answers: true, suffix: both ? '-answers' : '' }]
      : []),
    ...(request.includePuzzle ? [{ answers: false, suffix: '' }] : []),
  ]
}

function getUniqueStems(request: SavedExportRequest): string[] {
  const usedFilenames = new Set<string>()
  return request.snapshots.map((snapshot) => {
    const base = normalizeFilename(snapshot.name, snapshot.id)
    let stem = base
    let counter = 2
    const collides = () => [
      `${stem}.${request.format}`,
      `${stem}-answers.${request.format}`,
    ].some((filename) => usedFilenames.has(filename.toLocaleLowerCase('en-US')))
    while (collides()) {
      const suffix = `-${counter}`
      stem = `${[...base].slice(0, 120 - suffix.length).join('')}${suffix}`
      counter += 1
    }
    usedFilenames.add(`${stem}.${request.format}`.toLocaleLowerCase('en-US'))
    usedFilenames.add(
      `${stem}-answers.${request.format}`.toLocaleLowerCase('en-US'),
    )
    return stem
  })
}

/** Coordinates pure document rendering with injectable external export ports. */
export function createExportService(
  dependencies: ExportServiceDependencies = {},
): ExportService {
  const ports = {
    renderDocument: dependencies.renderDocument ?? renderSvg,
    exportPng: dependencies.exportPng ?? exportPng,
    exportPdf: dependencies.exportPdf ?? exportPdf,
    downloadBlob: dependencies.downloadBlob ?? downloadBlob,
    packageZip: dependencies.packageZip ?? packageZip,
  }

  async function createEntry(
    source: CurrentExportRequest['source'],
    format: ExportFormat,
    stem: string,
    variant: Variant,
  ): Promise<ZipEntry> {
    const document = createExportDocument(source, { answers: variant.answers })
    const svg = ports.renderDocument(document)
    let blob: Blob
    switch (format) {
      case 'svg':
        blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
        break
      case 'png':
        blob = await ports.exportPng(svg, document)
        break
      case 'pdf':
        blob = await ports.exportPdf(svg, document)
        break
    }
    return { filename: `${stem}${variant.suffix}.${format}`, blob }
  }

  return {
    async exportCurrent(request) {
      const variants = getCurrentVariants(request)
      if (variants.length === 0) {
        return createFailure(
          'Select at least one export variant',
          new Error('No export variants selected'),
        )
      }

      try {
        const stem = normalizeFilename(request.filename, 'word-search')
        const entries: ZipEntry[] = []
        for (const variant of variants) {
          entries.push(await createEntry(request.source, request.format, stem, variant))
        }
        for (const entry of entries) {
          await ports.downloadBlob(entry.blob, entry.filename)
        }
        return { ok: true }
      } catch (cause) {
        return createFailure('Failed to export current generation', cause)
      }
    },

    async exportSaved(request) {
      if (request.snapshots.length === 0) {
        return createFailure(
          'Select at least one saved generation',
          new Error('No saved generations selected'),
        )
      }

      try {
        const stems = getUniqueStems(request)
        const variants: readonly Variant[] = [
          { answers: true, suffix: '-answers' },
          { answers: false, suffix: '' },
        ]
        const entries: ZipEntry[] = []
        for (const [index, snapshot] of request.snapshots.entries()) {
          for (const variant of variants) {
            entries.push(await createEntry(
              snapshot,
              request.format,
              stems[index],
              variant,
            ))
          }
        }

        if (request.snapshots.length === 1) {
          for (const entry of entries) {
            await ports.downloadBlob(entry.blob, entry.filename)
          }
        } else {
          const zip = await ports.packageZip(entries)
          await ports.downloadBlob(zip, 'saved-generations.zip')
        }
        return { ok: true }
      } catch (cause) {
        return createFailure('Failed to export saved generations', cause)
      }
    },
  }
}
