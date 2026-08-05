import { jsPDF } from 'jspdf'
import { rasterizeSvg } from './rasterize'
import type { ExportBinaryAdapter, RasterizeSvg } from './types'

type PdfOrientation = 'landscape' | 'portrait'

interface PdfFactoryOptions {
  readonly orientation: PdfOrientation
  readonly unit: 'mm'
  readonly format: 'a4'
}

interface PdfDocumentPort {
  readonly internal: {
    readonly pageSize: {
      getWidth(): number
      getHeight(): number
    }
  }
  addImage(
    dataUrl: string,
    format: 'PNG',
    x: number,
    y: number,
    width: number,
    height: number,
  ): void
  output(type: 'blob'): Blob
}

interface PdfExporterDependencies {
  readonly rasterizeSvg: RasterizeSvg
  readonly createPdfDocument?: (options: PdfFactoryOptions) => PdfDocumentPort
}

const createJsPdfDocument = (options: PdfFactoryOptions): PdfDocumentPort =>
  new jsPDF(options) as PdfDocumentPort

/** Creates an A4 PDF exporter with proportional, centered 10mm margins. */
export function createPdfExporter(
  dependencies: PdfExporterDependencies = { rasterizeSvg },
): ExportBinaryAdapter {
  const createPdfDocument = dependencies.createPdfDocument ?? createJsPdfDocument

  return async (svg, document) => {
    const image = await dependencies.rasterizeSvg(svg, {
      width: document.width,
      height: document.height,
    })
    const orientation: PdfOrientation = document.width > document.height
      ? 'landscape'
      : 'portrait'
    const pdf = createPdfDocument({ orientation, unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const availableWidth = pageWidth - margin * 2
    const availableHeight = pageHeight - margin * 2
    const scale = Math.min(
      availableWidth / document.width,
      availableHeight / document.height,
    )
    const width = document.width * scale
    const height = document.height * scale
    const x = (pageWidth - width) / 2
    const y = (pageHeight - height) / 2

    pdf.addImage(image.dataUrl, 'PNG', x, y, width, height)
    return pdf.output('blob')
  }
}

export const exportPdf = createPdfExporter()
