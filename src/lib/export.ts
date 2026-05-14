import { jsPDF } from "jspdf"
import JSZip from "jszip"
import type { Cell, WordPlacement, SavedGeneration } from "@/types"

export interface ExportOptions {
  resolution?: { w: number; h: number }
  aspectRatio?: { w: number; h: number }
  both?: boolean
  filename?: string
  solutionGrid?: Cell[][]
  words?: string[]
  placements?: WordPlacement[]
  highlightColor?: string
  fontFamily?: string
  customFontUrl?: string
  useLocalFont?: boolean
  localFontFamily?: string
  localFontStyle?: string
}

function getGridTable(tableId = "word-search-grid-with-answers"): HTMLTableElement | null {
  const table = document.getElementById(tableId)
  if (!(table instanceof HTMLTableElement)) return null
  return table
}

interface CellExport {
  letter: string
  x: number
  y: number
  width: number
  height: number
  wordIndex: number | null
}

interface WordLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

const DIR_MAP: Record<string, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  'up-left': { dx: -1, dy: -1 },
  'up-right': { dx: 1, dy: -1 },
  'down-left': { dx: -1, dy: 1 },
  'down-right': { dx: 1, dy: 1 },
}

function buildWordLinesFromPlacements(placements: WordPlacement[], cellWidth: number, cellHeight: number): WordLine[] {
  return placements.map((p) => {
    const len = p.wordText.length
    const { dx, dy } = DIR_MAP[p.direction]
    const ex = p.startX + (len - 1) * dx
    const ey = p.startY + (len - 1) * dy
    return {
      x1: p.startX * cellWidth + cellWidth / 2,
      y1: p.startY * cellHeight + cellHeight / 2,
      x2: ex * cellWidth + cellWidth / 2,
      y2: ey * cellHeight + cellHeight / 2,
    }
  })
}

function readGridFromDOM(tableId?: string): { cells: CellExport[][]; cols: number; rows: number; cellWidth: number; cellHeight: number; fontFamily: string; fontSizePx: number; gridStyle: "full" | "outer" | "none"; wordLines: WordLine[] } | null {
  const table = getGridTable(tableId)
  if (!table) return null

  const tdElements = table.querySelectorAll("td")
  const rows = table.querySelectorAll("tr").length

  if (tdElements.length === 0 || rows === 0) return null
  if (tdElements.length % rows !== 0) {
    console.error("Grid table has mismatched rows and cells")
    return null
  }
  const cols = tdElements.length / rows

  const firstTd = tdElements[0]
  const computed = getComputedStyle(firstTd)
  const cellWidth = parseFloat(computed.width) || parseInt(computed.width) || 30
  const cellHeight = parseFloat(computed.height) || parseInt(computed.height) || 30
  const fontFamily = computed.fontFamily.split(",")[0].replace(/"/g, "").trim()
  const fontSizePx = parseFloat(computed.fontSize) || 16

  const gridStyle = (table.getAttribute('data-grid-style') as "full" | "outer" | "none") || "none"

  const cells: CellExport[][] = []
  const allTds = Array.from(tdElements)
  const wordMap = new Map<number, { x: number; y: number }[]>()

  for (let r = 0; r < rows; r++) {
    const row: CellExport[] = []
    for (let c = 0; c < cols; c++) {
      const td = allTds[r * cols + c]
      const wordIdxStr = td.getAttribute('data-word-index')
      const wordIndex = wordIdxStr !== null ? parseInt(wordIdxStr, 10) : null
      const cx = c * cellWidth + cellWidth / 2
      const cy = r * cellHeight + cellHeight / 2
      if (wordIndex !== null) {
        if (!wordMap.has(wordIndex)) wordMap.set(wordIndex, [])
        wordMap.get(wordIndex)!.push({ x: cx, y: cy })
      }
      row.push({
        letter: td.textContent || "",
        x: c * cellWidth,
        y: r * cellHeight,
        width: cellWidth,
        height: cellHeight,
        wordIndex,
      })
    }
    cells.push(row)
  }

  const wordLines: WordLine[] = []
  for (const [, positions] of wordMap) {
    if (positions.length < 2) continue
    positions.sort((a, b) => (a.y - b.y) || (a.x - b.x))
    const s = positions[0]
    const e = positions[positions.length - 1]
    wordLines.push({ x1: s.x, y1: s.y, x2: e.x, y2: e.y })
  }

  return { cells, cols, rows, cellWidth, cellHeight, fontFamily, fontSizePx, gridStyle, wordLines }
}

function buildSvgString(opts?: ExportOptions, tableId?: string, drawWordLines = true): string | null {
  const data = readGridFromDOM(tableId)
  if (!data) return null

  const { cells, cols, rows, cellWidth, cellHeight, fontFamily: domFont, fontSizePx, gridStyle, wordLines } = data
  const fontFamily = opts?.fontFamily || domFont
  const table = tableId ? document.getElementById(tableId) : null
  const highlightColor = opts?.highlightColor || table?.getAttribute("data-highlight-color") || "#90a4ae"

  let effectiveWordLines = wordLines
  if (drawWordLines && effectiveWordLines.length === 0 && opts?.both && opts?.placements && opts?.words) {
    effectiveWordLines = buildWordLinesFromPlacements(opts.placements, cellWidth, cellHeight)
  }

  const naturalW = cols * cellWidth
  const naturalH = rows * cellHeight

  let targetW = naturalW
  let targetH = naturalH

  if (opts?.resolution) {
    targetW = opts.resolution.w
    targetH = opts.resolution.h
  } else if (opts?.aspectRatio) {
    const targetRatio = opts.aspectRatio.w / opts.aspectRatio.h
    const currentRatio = naturalW / naturalH
    if (currentRatio > targetRatio) {
      targetH = naturalW / targetRatio
    } else {
      targetW = naturalH * targetRatio
    }
  }

  const scaleX = targetW / naturalW
  const scaleY = targetH / naturalH

  const fontAttrs = getFontStyleAttrs(opts)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${targetH}" font-family="${escapeXml(fontFamily)}" font-size="${fontSizePx}px">`
  svg += getFontStyle(fontFamily, opts)
  svg += `<g transform="scale(${scaleX},${scaleY})">`

  if (drawWordLines) {
    for (const wl of effectiveWordLines) {
      svg += `<line x1="${wl.x1}" y1="${wl.y1}" x2="${wl.x2}" y2="${wl.y2}" stroke="${escapeXml(highlightColor)}" stroke-width="${cellHeight * 0.7}" stroke-linecap="round" opacity="0.6" />`
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r][c]
      const cx = cell.x + cell.width / 2
      const cy = cell.y + cell.height / 2
      svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dy=".35em" fill="#000" font-family="${escapeXml(fontFamily)}"${fontAttrs}>${escapeXml(cell.letter)}</text>`
    }
  }

  if (gridStyle === "full") {
    for (let r = 1; r < rows; r++) {
      const y = r * cellHeight
      svg += `<line x1="0" y1="${y}" x2="${cols * cellWidth}" y2="${y}" stroke="#d1d5db" stroke-width="1" />`
    }
    for (let c = 1; c < cols; c++) {
      const x = c * cellWidth
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="${rows * cellHeight}" stroke="#d1d5db" stroke-width="1" />`
    }
  } else if (gridStyle === "outer") {
    svg += `<rect x="0" y="0" width="${cols * cellWidth}" height="${rows * cellHeight}" fill="none" stroke="#9ca3af" stroke-width="2" />`
  }

  svg += `</g></svg>`
  return svg
}

function getFontStyleAttrs(opts?: ExportOptions): string {
  let attrs = ''
  if (opts?.useLocalFont && opts?.localFontStyle) {
    const s = opts.localFontStyle.toLowerCase()
    if (s.includes('italic')) attrs += ' font-style="italic"'
    if (s.includes('bold')) attrs += ' font-weight="bold"'
  }
  return attrs
}

function getFontStyle(fontFamily: string, opts?: ExportOptions): string {
  if (opts?.customFontUrl) {
    return `<style><![CDATA[@import url('${opts.customFontUrl}');]]></style>`
  }
  if (opts?.useLocalFont && opts?.localFontFamily) {
    return `<style><![CDATA[@font-face { font-family: '${opts.localFontFamily}'; src: local('${opts.localFontFamily}'); }]]></style>`
  }
  const googleFonts: Record<string, string> = {
    Inter: "Inter:wght@400;500;600",
    Roboto: "Roboto:wght@400;500",
    "Open Sans": "Open+Sans:wght@400;500;600",
    Lato: "Lato:wght@400;700",
    Montserrat: "Montserrat:wght@400;500;600",
    Raleway: "Raleway:wght@400;500;600",
    Poppins: "Poppins:wght@400;500;600",
    Nunito: "Nunito:wght@400;500;600",
  }
  const spec = googleFonts[fontFamily]
  if (!spec) return ""
  return `<style><![CDATA[@import url('https://fonts.googleapis.com/css2?family=${spec}&display=swap');]]></style>`
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function buildSvgFromSaved(
  gen: SavedGeneration,
  opts: ExportOptions | undefined,
  drawWordLines: boolean
): string | null {
  const grid = drawWordLines ? gen.solutionGrid : gen.grid
  if (!grid || grid.length === 0 || grid[0].length === 0) return null

  const rows = grid.length
  const cols = grid[0].length
  const cellSize = gen.fontSize + 8
  const fontFamily = gen.fontFamily
  const highlightColor = gen.highlightColor
  const gridStyle = gen.gridStyle

  const effectiveWordLines = drawWordLines && gen.placements.length > 0
    ? buildWordLinesFromPlacements(gen.placements, cellSize, cellSize)
    : []

  const naturalW = cols * cellSize
  const naturalH = rows * cellSize

  let targetW = naturalW
  let targetH = naturalH

  if (opts?.resolution) {
    targetW = opts.resolution.w
    targetH = opts.resolution.h
  } else if (opts?.aspectRatio) {
    const targetRatio = opts.aspectRatio.w / opts.aspectRatio.h
    const currentRatio = naturalW / naturalH
    if (currentRatio > targetRatio) {
      targetH = naturalW / targetRatio
    } else {
      targetW = naturalH * targetRatio
    }
  }

  const scaleX = targetW / naturalW
  const scaleY = targetH / naturalH

  const fontAttrsSaved = getFontStyleAttrs(opts)

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${targetH}" font-family="${escapeXml(fontFamily)}" font-size="${gen.fontSize}px">`
  svg += getFontStyle(fontFamily, opts)
  svg += `<g transform="scale(${scaleX},${scaleY})">`

  if (drawWordLines) {
    for (const wl of effectiveWordLines) {
      svg += `<line x1="${wl.x1}" y1="${wl.y1}" x2="${wl.x2}" y2="${wl.y2}" stroke="${escapeXml(highlightColor)}" stroke-width="${cellSize * 0.7}" stroke-linecap="round" opacity="0.6" />`
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c]
      const cx = c * cellSize + cellSize / 2
      const cy = r * cellSize + cellSize / 2
      svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dy=".35em" fill="#000" font-family="${escapeXml(fontFamily)}"${fontAttrsSaved}>${escapeXml(cell.letter)}</text>`
    }
  }

  if (gridStyle === "full") {
    for (let r = 1; r < rows; r++) {
      const y = r * cellSize
      svg += `<line x1="0" y1="${y}" x2="${cols * cellSize}" y2="${y}" stroke="#d1d5db" stroke-width="1" />`
    }
    for (let c = 1; c < cols; c++) {
      const x = c * cellSize
      svg += `<line x1="${x}" y1="0" x2="${x}" y2="${rows * cellSize}" stroke="#d1d5db" stroke-width="1" />`
    }
  } else if (gridStyle === "outer") {
    svg += `<rect x="0" y="0" width="${cols * cellSize}" height="${rows * cellSize}" fill="none" stroke="#9ca3af" stroke-width="2" />`
  }

  svg += `</g></svg>`
  return svg
}

export function exportSavedSVG(gen: SavedGeneration, filename: string, opts?: ExportOptions, zip?: JSZip): void {
  const svgAnswers = buildSvgFromSaved(gen, opts, true)
  if (svgAnswers) {
    const blob = new Blob([svgAnswers], { type: "image/svg+xml" })
    if (zip) {
      zip.file(`${filename}-answers.svg`, blob)
    } else {
      downloadBlob(blob, `${filename}-answers.svg`)
    }
  }
  const svgNoAnswers = buildSvgFromSaved(gen, opts, false)
  if (svgNoAnswers) {
    const blob = new Blob([svgNoAnswers], { type: "image/svg+xml" })
    if (zip) {
      zip.file(`${filename}.svg`, blob)
    } else {
      downloadBlob(blob, `${filename}.svg`)
    }
  }
}

export async function exportSavedPNG(gen: SavedGeneration, filename: string, opts?: ExportOptions, zip?: JSZip): Promise<void> {
  if (zip) {
    await exportSavedPNGSingle(gen, opts, true, `${filename}-answers.png`, zip)
    await exportSavedPNGSingle(gen, opts, false, `${filename}.png`, zip)
  } else {
    await exportSavedPNGSingle(gen, opts, true, `${filename}-answers.png`)
    await exportSavedPNGSingle(gen, opts, false, `${filename}.png`)
  }
}

async function exportSavedPNGSingle(gen: SavedGeneration, opts: ExportOptions | undefined, drawWordLines: boolean, filename: string, zip?: JSZip): Promise<void> {
  const svg = buildSvgFromSaved(gen, opts, drawWordLines)
  if (!svg) return

  const svgBlob = new Blob([svg], { type: "image/svg+xml" })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      if (opts?.resolution) {
        canvas.width = opts.resolution.w
        canvas.height = opts.resolution.h
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) {
          if (zip) {
            zip.file(filename, blob)
          } else {
            downloadBlob(blob, filename)
          }
        }
        URL.revokeObjectURL(url)
        resolve()
      }, "image/png")
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG image for PNG export"))
    }
    img.src = url
  })
}

export async function exportSavedPDF(gen: SavedGeneration, filename: string, opts?: ExportOptions, zip?: JSZip): Promise<void> {
  if (zip) {
    await exportSavedPDFSingle(gen, opts, true, `${filename}-answers.pdf`, zip)
    await exportSavedPDFSingle(gen, opts, false, `${filename}.pdf`, zip)
  } else {
    await exportSavedPDFSingle(gen, opts, true, `${filename}-answers.pdf`)
    await exportSavedPDFSingle(gen, opts, false, `${filename}.pdf`)
  }
}

async function exportSavedPDFSingle(gen: SavedGeneration, opts: ExportOptions | undefined, drawWordLines: boolean, filename: string, zip?: JSZip): Promise<void> {
  const svg = buildSvgFromSaved(gen, opts, drawWordLines)
  if (!svg) return

  const svgBlob = new Blob([svg], { type: "image/svg+xml" })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)

      const pngData = canvas.toDataURL("image/png")

      const orientation = img.width > img.height ? "landscape" : "portrait"
      const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 10
      const maxW = pageW - margin * 2
      const maxH = pageH - margin * 2

      let drawW = img.width
      let drawH = img.height
      if (drawW > maxW || drawH > maxH) {
        const scale = Math.min(maxW / drawW, maxH / drawH)
        drawW *= scale
        drawH *= scale
      }

      const x = (pageW - drawW) / 2
      const y = (pageH - drawH) / 2
      pdf.addImage(pngData, "PNG", x, y, drawW, drawH)

      if (zip) {
        zip.file(filename, pdf.output('arraybuffer'))
      } else {
        pdf.save(filename)
      }

      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG image for PDF export"))
    }
    img.src = url
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportSVG(opts?: ExportOptions): void {
  const name = opts?.filename || "ws"
  if (opts?.both) {
    const svgAnswers = buildSvgString(opts, "word-search-grid-content", true)
    if (svgAnswers) {
      downloadBlob(new Blob([svgAnswers], { type: "image/svg+xml" }), `${name}-answers.svg`)
    }
    const svgNoAnswers = buildSvgString(opts, "word-search-grid-content", false)
    if (svgNoAnswers) {
      downloadBlob(new Blob([svgNoAnswers], { type: "image/svg+xml" }), `${name}.svg`)
    }
    return
  }
  const svg = buildSvgString(opts, "word-search-grid-content", true)
  if (!svg) {
    console.error("No visible word search grid found")
    return
  }
  downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`)
}

export async function exportPNG(opts?: ExportOptions): Promise<void> {
  const name = opts?.filename || "ws"
  if (opts?.both) {
    await exportPNGSingle(opts, "word-search-grid-content", true, `${name}-answers.png`)
    await exportPNGSingle(opts, "word-search-grid-content", false, `${name}.png`)
    return
  }
  await exportPNGSingle(opts, "word-search-grid-content", true, `${name}.png`)
}

async function exportPNGSingle(opts: ExportOptions | undefined, tableId: string, drawWordLines: boolean, filename: string): Promise<void> {
  const svg = buildSvgString(opts, tableId, drawWordLines)
  if (!svg) {
    console.error("No visible word search grid found")
    return
  }

  const svgBlob = new Blob([svg], { type: "image/svg+xml" })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      if (opts?.resolution) {
        canvas.width = opts.resolution.w
        canvas.height = opts.resolution.h
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, filename)
        URL.revokeObjectURL(url)
        resolve()
      }, "image/png")
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG image for PNG export"))
    }
    img.src = url
  })
}

export async function exportPDF(opts?: ExportOptions): Promise<void> {
  const name = opts?.filename || "ws"
  if (opts?.both) {
    await exportPDFSingle(opts, "word-search-grid-content", true, `${name}-answers.pdf`)
    await exportPDFSingle(opts, "word-search-grid-content", false, `${name}.pdf`)
    return
  }
  await exportPDFSingle(opts, "word-search-grid-content", true, `${name}.pdf`)
}

async function exportPDFSingle(opts: ExportOptions | undefined, tableId: string, drawWordLines: boolean, filename: string): Promise<void> {
  const svg = buildSvgString(opts, tableId, drawWordLines)
  if (!svg) {
    console.error("No visible word search grid found")
    return
  }

  const svgBlob = new Blob([svg], { type: "image/svg+xml" })
  const url = URL.createObjectURL(svgBlob)

  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)

      const pngData = canvas.toDataURL("image/png")

      const orientation = img.width > img.height ? "landscape" : "portrait"
      const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 10
      const maxW = pageW - margin * 2
      const maxH = pageH - margin * 2

      let drawW = img.width
      let drawH = img.height
      if (drawW > maxW || drawH > maxH) {
        const scale = Math.min(maxW / drawW, maxH / drawH)
        drawW *= scale
        drawH *= scale
      }

      const x = (pageW - drawW) / 2
      const y = (pageH - drawH) / 2
      pdf.addImage(pngData, "PNG", x, y, drawW, drawH)
      pdf.save(filename)

      URL.revokeObjectURL(url)
      resolve()
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load SVG image for PDF export"))
    }
    img.src = url
  })
}
