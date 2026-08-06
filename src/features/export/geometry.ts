import type { ExportDimensions } from './types'

/** Rejects geometry that browser and document renderers cannot represent safely. */
export function assertPositiveDimensions(dimensions: ExportDimensions): void {
  if (!Number.isFinite(dimensions.width)
    || !Number.isFinite(dimensions.height)
    || dimensions.width <= 0
    || dimensions.height <= 0
  ) {
    throw new RangeError('Export dimensions must be positive finite numbers')
  }
}
