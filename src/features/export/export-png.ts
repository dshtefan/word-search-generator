import { rasterizeSvg } from './rasterize'
import type { ExportBinaryAdapter, RasterizeSvg } from './types'

interface PngExporterDependencies {
  readonly rasterizeSvg: RasterizeSvg
}

/** Creates a PNG exporter whose only side effect is delegated rasterization. */
export function createPngExporter(
  dependencies: PngExporterDependencies = { rasterizeSvg },
): ExportBinaryAdapter {
  return async (svg, document) => {
    const image = await dependencies.rasterizeSvg(svg, {
      width: document.width,
      height: document.height,
    })
    return image.blob
  }
}

export const exportPng = createPngExporter()
