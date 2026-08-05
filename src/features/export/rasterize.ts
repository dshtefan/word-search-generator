import type {
  RasterCanvasPort,
  RasterImagePort,
  RasterizeBrowserPort,
  RasterizeSvg,
} from './types'

const browserPort: RasterizeBrowserPort = {
  createCanvas: () => document.createElement('canvas') as unknown as RasterCanvasPort,
  createImage: () => new Image() as unknown as RasterImagePort,
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
}

function loadImage(
  url: string,
  createImage: () => RasterImagePort,
): Promise<RasterImagePort> {
  return new Promise((resolve, reject) => {
    const image = createImage()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load SVG image'))
    try {
      image.src = url
    } catch (cause) {
      reject(cause)
    }
  })
}

function createPngBlob(canvas: RasterCanvasPort): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob === null) {
          reject(new Error('Canvas did not produce a PNG blob'))
          return
        }
        resolve(blob)
      }, 'image/png')
    } catch (cause) {
      reject(cause)
    }
  })
}

/** Creates an SVG rasterizer over the minimal Image, Canvas, and URL surface. */
export function createSvgRasterizer(
  browser: RasterizeBrowserPort = browserPort,
): RasterizeSvg {
  return async (svg, dimensions) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = browser.createObjectURL(svgBlob)

    try {
      const image = await loadImage(objectUrl, browser.createImage)
      const canvas = browser.createCanvas()
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const context = canvas.getContext('2d')
      if (context === null) {
        throw new Error('Canvas 2D context is unavailable')
      }

      context.drawImage(image, 0, 0, dimensions.width, dimensions.height)
      const blob = await createPngBlob(canvas)
      return {
        blob,
        dataUrl: canvas.toDataURL('image/png'),
        width: dimensions.width,
        height: dimensions.height,
      }
    } finally {
      browser.revokeObjectURL(objectUrl)
    }
  }
}

export const rasterizeSvg = createSvgRasterizer()
