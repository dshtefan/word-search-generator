import type {
  RasterCanvasPort,
  RasterImagePort,
  RasterizeBrowserPort,
  RasterizeSvg,
  RasterizeTimeoutPort,
} from './types'

const browserPort: RasterizeBrowserPort = {
  createCanvas: () => document.createElement('canvas') as unknown as RasterCanvasPort,
  createImage: () => new Image() as unknown as RasterImagePort,
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
}

const timeoutPort: RasterizeTimeoutPort = {
  timeoutMilliseconds: 10_000,
  schedule: (callback, delayMilliseconds) =>
    setTimeout(callback, delayMilliseconds),
  cancel: (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
}

function loadImage(
  url: string,
  createImage: () => RasterImagePort,
  timeout: RasterizeTimeoutPort,
): Promise<RasterImagePort> {
  return new Promise((resolve, reject) => {
    const image = createImage()
    let settled = false
    const timer = { handle: undefined as unknown, isSet: false }
    const cancelTimer = () => {
      if (!timer.isSet) return
      timeout.cancel(timer.handle)
      timer.isSet = false
    }
    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      cancelTimer()
      image.onload = null
      image.onerror = null
      callback()
    }
    image.onload = () => settle(() => resolve(image))
    image.onerror = () => settle(() => reject(
      new Error('Failed to load SVG image'),
    ))
    timer.handle = timeout.schedule(() => settle(() => reject(
      new Error('Timed out while loading SVG image'),
    )), timeout.timeoutMilliseconds)
    timer.isSet = true
    if (settled) cancelTimer()
    try {
      image.src = url
    } catch (cause) {
      settle(() => reject(cause))
    }
  })
}

function createPngBlob(
  canvas: RasterCanvasPort,
  timeout: RasterizeTimeoutPort,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timer = { handle: undefined as unknown, isSet: false }
    const cancelTimer = () => {
      if (!timer.isSet) return
      timeout.cancel(timer.handle)
      timer.isSet = false
    }
    const settle = (callback: () => void) => {
      if (settled) return
      settled = true
      cancelTimer()
      callback()
    }
    timer.handle = timeout.schedule(() => settle(() => reject(
      new Error('Timed out while creating PNG blob'),
    )), timeout.timeoutMilliseconds)
    timer.isSet = true
    if (settled) cancelTimer()
    try {
      canvas.toBlob((blob) => {
        if (blob === null) {
          settle(() => reject(new Error('Canvas did not produce a PNG blob')))
          return
        }
        settle(() => resolve(blob))
      }, 'image/png')
    } catch (cause) {
      settle(() => reject(cause))
    }
  })
}

/** Creates an SVG rasterizer over the minimal Image, Canvas, and URL surface. */
export function createSvgRasterizer(
  browser: RasterizeBrowserPort = browserPort,
  timeout: RasterizeTimeoutPort = timeoutPort,
): RasterizeSvg {
  return async (svg, dimensions) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const objectUrl = browser.createObjectURL(svgBlob)

    try {
      const image = await loadImage(objectUrl, browser.createImage, timeout)
      const canvas = browser.createCanvas()
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const context = canvas.getContext('2d')
      if (context === null) {
        throw new Error('Canvas 2D context is unavailable')
      }

      context.drawImage(image, 0, 0, dimensions.width, dimensions.height)
      const blob = await createPngBlob(canvas, timeout)
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
