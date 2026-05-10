/// <reference types="vite/client" />

declare const __APP_VERSION__: string

interface FontData {
  family: string
  fullName: string
  postscriptName: string
  style: string
  blob(): Promise<Blob>
}

interface Window {
  queryLocalFonts(options?: { postscriptNames?: string[] }): Promise<FontData[]>
}
