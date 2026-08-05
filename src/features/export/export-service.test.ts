/** @jest-environment node */

import type { SavedGeneration } from '@/features/saved-generations/types'
import { createBlobDownloader, createZipPackager } from './download'
import { createExportService } from './export-service'
import { createPdfExporter } from './export-pdf'
import { createPngExporter } from './export-png'
import { createSvgRasterizer } from './rasterize'
import { renderSvg } from './render-svg'
import type {
  ExportBinaryAdapter,
  ExportDocument,
  RasterizeBrowserPort,
  RasterizedImage,
  ZipArchivePort,
} from './types'

function createSnapshot(
  overrides: Partial<Pick<SavedGeneration, 'id' | 'name' | 'createdAt'>> = {},
): SavedGeneration {
  return {
    id: overrides.id ?? 'saved-1',
    name: overrides.name ?? 'Lesson One',
    createdAt: overrides.createdAt ?? 1,
    settings: {
      generation: {
        words: ['CAT'],
        language: 'en',
        width: 2,
        height: 1,
        cardinalDirections: ['right'],
        diagonalDirections: [],
      },
      appearance: {
        highlightColor: '#123456',
        fontFamily: 'Example Sans',
        fontSize: 12,
        gridStyle: 'full',
        customFont: { enabled: false, url: '' },
        localFont: { enabled: false, family: '', fullName: '', style: '' },
      },
      output: {
        mode: 'resolution',
        resolution: { width: 200, height: 100 },
        aspectRatio: { width: 2, height: 1 },
      },
    },
    result: {
      puzzle: [[{ letter: 'X' }, { letter: 'Y' }]],
      solution: [[{ letter: 'C' }, { letter: 'A' }]],
      placements: [
        { x: 0, y: 0, wordIndex: 0, direction: 'right', word: 'CA' },
      ],
    },
  }
}

function createServiceHarness(overrides: {
  readonly exportPng?: ExportBinaryAdapter
  readonly exportPdf?: ExportBinaryAdapter
  readonly packageZip?: (entries: readonly { filename: string; blob: Blob }[]) => Promise<Blob>
} = {}) {
  const downloads: { blob: Blob; filename: string }[] = []
  const zipped: { filename: string; blob: Blob }[][] = []
  const renderDocument = jest.fn(renderSvg)
  const exportPng = overrides.exportPng ?? jest.fn(async () =>
    new Blob(['png'], { type: 'image/png' }))
  const exportPdf = overrides.exportPdf ?? jest.fn(async () =>
    new Blob(['pdf'], { type: 'application/pdf' }))
  const packageZip = overrides.packageZip ?? jest.fn(async (entries) => {
    zipped.push([...entries])
    return new Blob(['zip'], { type: 'application/zip' })
  })
  const service = createExportService({
    renderDocument,
    exportPng,
    exportPdf,
    packageZip,
    downloadBlob: async (blob, filename) => {
      downloads.push({ blob, filename })
    },
  })

  return {
    service,
    downloads,
    zipped,
    renderDocument,
    exportPng,
    exportPdf,
    packageZip,
  }
}

describe('createExportService', () => {
  test('exports answer and puzzle SVGs with safe, unambiguous filenames', async () => {
    const harness = createServiceHarness()

    const result = await harness.service.exportCurrent({
      source: createSnapshot(),
      format: 'svg',
      filename: ' Unit/One ',
      includeAnswers: true,
      includePuzzle: true,
    })

    expect(result).toEqual({ ok: true })
    expect(harness.downloads.map(({ filename }) => filename)).toEqual([
      'Unit-One-answers.svg',
      'Unit-One.svg',
    ])
    await expect(harness.downloads[0].blob.text()).resolves.toContain(
      'stroke="#123456"',
    )
    await expect(harness.downloads[1].blob.text()).resolves.not.toContain(
      'stroke="#123456"',
    )
  })

  test.each([
    { includeAnswers: true, includePuzzle: false, expectedPaths: 1 },
    { includeAnswers: false, includePuzzle: true, expectedPaths: 0 },
  ])('uses the base filename for a single selected variant', async (selection) => {
    const harness = createServiceHarness()

    const result = await harness.service.exportCurrent({
      source: createSnapshot(),
      format: 'svg',
      filename: 'single',
      ...selection,
    })

    expect(result).toEqual({ ok: true })
    expect(harness.downloads.map(({ filename }) => filename)).toEqual([
      'single.svg',
    ])
    expect(harness.renderDocument.mock.calls[0][0].paths).toHaveLength(
      selection.expectedPaths,
    )
  })

  test.each([
    ['png', 'image/png'],
    ['pdf', 'application/pdf'],
  ] as const)('dispatches %s through only its binary adapter', async (format, type) => {
    const harness = createServiceHarness()

    const result = await harness.service.exportCurrent({
      source: createSnapshot(),
      format,
      filename: 'dispatch',
      includeAnswers: false,
      includePuzzle: true,
    })

    expect(result).toEqual({ ok: true })
    expect(harness.downloads).toHaveLength(1)
    expect(harness.downloads[0]).toMatchObject({
      filename: `dispatch.${format}`,
      blob: expect.objectContaining({ type }),
    })
    expect(harness.exportPng).toHaveBeenCalledTimes(format === 'png' ? 1 : 0)
    expect(harness.exportPdf).toHaveBeenCalledTimes(format === 'pdf' ? 1 : 0)
  })

  test('downloads both variants directly for one saved generation', async () => {
    const harness = createServiceHarness()

    const result = await harness.service.exportSaved({
      snapshots: [createSnapshot({ name: '../Lesson:One' })],
      format: 'svg',
    })

    expect(result).toEqual({ ok: true })
    expect(harness.packageZip).not.toHaveBeenCalled()
    expect(harness.downloads.map(({ filename }) => filename)).toEqual([
      'Lesson-One-answers.svg',
      'Lesson-One.svg',
    ])
  })

  test('packages every variant while rendering each saved snapshot with its own settings', async () => {
    const wide = createSnapshot({ id: 'wide', name: 'Unit/One' })
    wide.settings.output.resolution = { width: 400, height: 100 }
    wide.settings.appearance.fontSize = 18
    const square = createSnapshot({ id: 'square', name: 'Unit:One' })
    square.settings.output.resolution = { width: 150, height: 150 }
    square.settings.appearance.fontSize = 30
    const harness = createServiceHarness()

    const result = await harness.service.exportSaved({
      snapshots: [wide, square],
      format: 'svg',
    })

    expect(result).toEqual({ ok: true })
    expect(harness.renderDocument).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        width: 400,
        height: 100,
        font: expect.objectContaining({ size: 18 }),
      }),
    )
    expect(harness.renderDocument).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        width: 150,
        height: 150,
        font: expect.objectContaining({ size: 30 }),
      }),
    )
    expect(harness.zipped[0].map(({ filename }) => filename)).toEqual([
      'Unit-One-answers.svg',
      'Unit-One.svg',
      'Unit-One-2-answers.svg',
      'Unit-One-2.svg',
    ])
    expect(harness.downloads).toEqual([
      { blob: expect.objectContaining({ type: 'application/zip' }), filename: 'saved-generations.zip' },
    ])
  })

  test('returns a typed failure and emits no partial downloads when an adapter rejects', async () => {
    const cause = new Error('canvas unavailable')
    const harness = createServiceHarness({
      exportPng: jest.fn(async () => { throw cause }),
    })

    const result = await harness.service.exportCurrent({
      source: createSnapshot(),
      format: 'png',
      filename: 'failure',
      includeAnswers: true,
      includePuzzle: true,
    })

    expect(result).toEqual({
      ok: false,
      message: 'Failed to export current generation',
      cause,
    })
    expect(harness.downloads).toEqual([])
  })

  test('returns typed failures for empty variant and snapshot selections', async () => {
    const harness = createServiceHarness()

    const current = await harness.service.exportCurrent({
      source: createSnapshot(),
      format: 'svg',
      filename: 'none',
      includeAnswers: false,
      includePuzzle: false,
    })
    const saved = await harness.service.exportSaved({ snapshots: [], format: 'svg' })

    expect(current).toMatchObject({
      ok: false,
      message: 'Select at least one export variant',
      cause: expect.any(Error),
    })
    expect(saved).toMatchObject({
      ok: false,
      message: 'Select at least one saved generation',
      cause: expect.any(Error),
    })
    expect(harness.downloads).toEqual([])
  })
})

interface RasterHarnessOptions {
  readonly imageFails?: boolean
  readonly context?: { drawImage: jest.Mock } | null
  readonly outputBlob?: Blob | null
}

function createRasterHarness(options: RasterHarnessOptions = {}) {
  const urls: string[] = []
  const revoked: string[] = []
  const context = options.context === undefined
    ? { drawImage: jest.fn() }
    : options.context
  const canvas = {
    width: 0,
    height: 0,
    getContext: jest.fn(() => context),
    toBlob: jest.fn((callback: (blob: Blob | null) => void) => {
      callback(options.outputBlob === undefined
        ? new Blob(['png'], { type: 'image/png' })
        : options.outputBlob)
    }),
    toDataURL: jest.fn(() => 'data:image/png;base64,cG5n'),
  }
  const browser: RasterizeBrowserPort = {
    createCanvas: () => canvas,
    createImage: () => {
      let source = ''
      return {
        onload: null,
        onerror: null,
        get src() { return source },
        set src(value: string) {
          source = value
          queueMicrotask(() => {
            if (options.imageFails) this.onerror?.(new Error('image failed'))
            else this.onload?.()
          })
        },
      }
    },
    createObjectURL: () => {
      const url = `blob:${urls.length + 1}`
      urls.push(url)
      return url
    },
    revokeObjectURL: (url) => { revoked.push(url) },
  }

  return { browser, canvas, context, urls, revoked }
}

describe('createSvgRasterizer', () => {
  test('draws at requested dimensions, creates PNG data, and revokes its object URL', async () => {
    const harness = createRasterHarness()
    const rasterize = createSvgRasterizer(harness.browser)

    const result = await rasterize('<svg />', { width: 320, height: 180 })

    expect(result).toMatchObject({
      width: 320,
      height: 180,
      dataUrl: 'data:image/png;base64,cG5n',
      blob: expect.objectContaining({ type: 'image/png' }),
    })
    expect(harness.canvas).toMatchObject({ width: 320, height: 180 })
    expect(harness.context?.drawImage).toHaveBeenCalledWith(
      expect.any(Object), 0, 0, 320, 180,
    )
    expect(harness.revoked).toEqual(harness.urls)
  })

  test.each([
    ['image load failure', { imageFails: true }, 'Failed to load SVG image'],
    ['null 2D context', { context: null }, 'Canvas 2D context is unavailable'],
    ['null PNG blob', { outputBlob: null }, 'Canvas did not produce a PNG blob'],
  ] as const)('rejects on %s and still revokes its object URL', async (_name, options, message) => {
    const harness = createRasterHarness(options)
    const rasterize = createSvgRasterizer(harness.browser)

    await expect(rasterize('<svg />', { width: 20, height: 10 }))
      .rejects.toThrow(message)
    expect(harness.revoked).toEqual(harness.urls)
  })

  test('uses the default browser boundary without retaining its object URL', async () => {
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
    const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image')
    const context = { drawImage: jest.fn() }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => context,
      toBlob: (callback: (blob: Blob | null) => void) => {
        callback(new Blob(['png'], { type: 'image/png' }))
      },
      toDataURL: () => 'data:image/png;base64,cG5n',
    }
    class FakeImage {
      onload: (() => void) | null = null
      onerror: ((cause?: unknown) => void) | null = null
      get src() { return 'blob:default-raster' }
      set src(_value: string) { queueMicrotask(() => this.onload?.()) }
    }
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { createElement: () => canvas },
    })
    Object.defineProperty(globalThis, 'Image', {
      configurable: true,
      value: FakeImage,
    })
    const createObjectUrl = jest.spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:default-raster')
    const revokeObjectUrl = jest.spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined)

    try {
      await expect(createSvgRasterizer()('<svg />', { width: 12, height: 6 }))
        .resolves.toMatchObject({ width: 12, height: 6 })
      expect(createObjectUrl).toHaveBeenCalledTimes(1)
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:default-raster')
    } finally {
      createObjectUrl.mockRestore()
      revokeObjectUrl.mockRestore()
      if (originalDocument === undefined) delete (globalThis as { document?: unknown }).document
      else Object.defineProperty(globalThis, 'document', originalDocument)
      if (originalImage === undefined) delete (globalThis as { Image?: unknown }).Image
      else Object.defineProperty(globalThis, 'Image', originalImage)
    }
  })
})

describe('createPngExporter', () => {
  test('returns the rasterized PNG blob using document dimensions', async () => {
    const png = new Blob(['png'], { type: 'image/png' })
    const rasterizeSvg = jest.fn<Promise<RasterizedImage>, [string, { width: number; height: number }]>(
      async () => ({ blob: png, dataUrl: 'data:image/png;base64,cG5n', width: 80, height: 40 }),
    )
    const exporter = createPngExporter({ rasterizeSvg })
    const document = { width: 80, height: 40 } as ExportDocument

    await expect(exporter('<svg />', document)).resolves.toBe(png)
    expect(rasterizeSvg).toHaveBeenCalledWith('<svg />', { width: 80, height: 40 })
  })
})

describe('createPdfExporter', () => {
  test.each([
    {
      dimensions: { width: 400, height: 200 },
      page: { width: 297, height: 210 },
      orientation: 'landscape',
      expected: [10, 35.75, 277, 138.5],
    },
    {
      dimensions: { width: 100, height: 200 },
      page: { width: 210, height: 297 },
      orientation: 'portrait',
      expected: [35.75, 10, 138.5, 277],
    },
  ] as const)('fits a $orientation document proportionally inside A4 with 10mm margins', async ({ dimensions, page, orientation, expected }) => {
    const output = new Blob(['pdf'], { type: 'application/pdf' })
    const addImage = jest.fn()
    const createPdfDocument = jest.fn(() => ({
      internal: {
        pageSize: {
          getWidth: () => page.width,
          getHeight: () => page.height,
        },
      },
      addImage,
      output: jest.fn(() => output),
    }))
    const rasterizeSvg = jest.fn(async (): Promise<RasterizedImage> => ({
      blob: new Blob(['png']),
      dataUrl: 'data:image/png;base64,cG5n',
      ...dimensions,
    }))
    const exporter = createPdfExporter({ rasterizeSvg, createPdfDocument })

    await expect(exporter('<svg />', dimensions as ExportDocument)).resolves.toBe(output)
    expect(createPdfDocument).toHaveBeenCalledWith({ orientation, unit: 'mm', format: 'a4' })
    expect(addImage).toHaveBeenCalledWith(
      'data:image/png;base64,cG5n',
      'PNG',
      ...expected,
    )
  })

  test('emits a PDF blob through the default jsPDF boundary', async () => {
    const rasterizeSvg = jest.fn(async (): Promise<RasterizedImage> => ({
      blob: new Blob(['png']),
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      width: 1,
      height: 1,
    }))
    const exporter = createPdfExporter({ rasterizeSvg })

    await expect(exporter('<svg />', {
      width: 1,
      height: 1,
    } as ExportDocument)).resolves.toMatchObject({ type: 'application/pdf' })
  })
})

describe('createBlobDownloader', () => {
  test.each([false, true])('revokes its object URL when anchor clicking fails=%s', (clickFails) => {
    const revoked: string[] = []
    const removed: unknown[] = []
    const anchor = {
      href: '',
      download: '',
      click: () => {
        if (clickFails) throw new Error('click failed')
      },
    }
    const download = createBlobDownloader({
      createObjectURL: () => 'blob:download',
      revokeObjectURL: (url) => { revoked.push(url) },
      createAnchor: () => anchor,
      appendAnchor: jest.fn(),
      removeAnchor: (value) => { removed.push(value) },
    })

    if (clickFails) {
      expect(() => download(new Blob(['file']), 'lesson.svg')).toThrow('click failed')
    } else {
      expect(() => download(new Blob(['file']), 'lesson.svg')).not.toThrow()
    }
    expect(anchor).toMatchObject({ href: 'blob:download', download: 'lesson.svg' })
    expect(removed).toEqual([anchor])
    expect(revoked).toEqual(['blob:download'])
  })

  test('uses the default DOM boundary and removes the temporary anchor', () => {
    const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
    const anchor = { href: '', download: '', click: jest.fn() }
    const appendChild = jest.fn()
    const removeChild = jest.fn()
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: () => anchor,
        body: { appendChild, removeChild },
      },
    })
    const createObjectUrl = jest.spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:default-download')
    const revokeObjectUrl = jest.spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined)

    try {
      createBlobDownloader()(new Blob(['file']), 'lesson.svg')
      expect(appendChild).toHaveBeenCalledWith(anchor)
      expect(anchor.click).toHaveBeenCalledTimes(1)
      expect(removeChild).toHaveBeenCalledWith(anchor)
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:default-download')
    } finally {
      createObjectUrl.mockRestore()
      revokeObjectUrl.mockRestore()
      if (originalDocument === undefined) delete (globalThis as { document?: unknown }).document
      else Object.defineProperty(globalThis, 'document', originalDocument)
    }
  })
})

describe('createZipPackager', () => {
  test('adds every named blob and generates one ZIP blob', async () => {
    const files: { filename: string; blob: Blob }[] = []
    const output = new Blob(['zip'], { type: 'application/zip' })
    const archive: ZipArchivePort = {
      file: (filename, blob) => { files.push({ filename, blob }) },
      generateBlob: async () => output,
    }
    const packageZip = createZipPackager({ createArchive: () => archive })
    const entries = [
      { filename: 'one.svg', blob: new Blob(['one']) },
      { filename: 'two.svg', blob: new Blob(['two']) },
    ]

    await expect(packageZip(entries)).resolves.toBe(output)
    expect(files).toEqual(entries)
  })
})
