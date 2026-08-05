import JSZip from 'jszip'
import type {
  BlobDownloadPort,
  ZipArchivePort,
  ZipPackagingPort,
} from './types'

interface DownloadAnchorPort {
  href: string
  download: string
  click(): void
}

interface BlobDownloaderDependencies {
  readonly createObjectURL: (blob: Blob) => string
  readonly revokeObjectURL: (url: string) => void
  readonly createAnchor: () => DownloadAnchorPort
  readonly appendAnchor: (anchor: DownloadAnchorPort) => void
  readonly removeAnchor: (anchor: DownloadAnchorPort) => void
}

const browserDependencies: BlobDownloaderDependencies = {
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  createAnchor: () => document.createElement('a'),
  appendAnchor: (anchor) => {
    document.body.appendChild(anchor as HTMLAnchorElement)
  },
  removeAnchor: (anchor) => {
    document.body.removeChild(anchor as HTMLAnchorElement)
  },
}

interface ZipPackagerDependencies {
  readonly createArchive: () => ZipArchivePort
}

function createJsZipArchive(): ZipArchivePort {
  const archive = new JSZip()
  return {
    file: (filename, blob) => {
      archive.file(filename, blob)
    },
    generateBlob: () => archive.generateAsync({ type: 'blob' }),
  }
}

/** Creates a direct downloader that always removes its anchor and object URL. */
export function createBlobDownloader(
  dependencies: BlobDownloaderDependencies = browserDependencies,
): BlobDownloadPort {
  return (blob, filename) => {
    const objectUrl = dependencies.createObjectURL(blob)
    let anchor: DownloadAnchorPort | undefined
    let appended = false

    try {
      anchor = dependencies.createAnchor()
      anchor.href = objectUrl
      anchor.download = filename
      dependencies.appendAnchor(anchor)
      appended = true
      anchor.click()
    } finally {
      try {
        if (appended && anchor !== undefined) {
          dependencies.removeAnchor(anchor)
        }
      } finally {
        dependencies.revokeObjectURL(objectUrl)
      }
    }
  }
}

/** Creates a ZIP packager over the minimal archive boundary used by exports. */
export function createZipPackager(
  dependencies: ZipPackagerDependencies = { createArchive: createJsZipArchive },
): ZipPackagingPort {
  return async (entries) => {
    const archive = dependencies.createArchive()
    for (const entry of entries) {
      archive.file(entry.filename, await entry.blob.arrayBuffer())
    }
    return archive.generateBlob()
  }
}

export const downloadBlob = createBlobDownloader()
export const packageZip = createZipPackager()
