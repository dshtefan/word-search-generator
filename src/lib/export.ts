import { jsPDF } from "jspdf"
import type { Cell } from "@/types"

export interface ExportOptions {
  resolution?: { w: number; h: number }
  aspectRatio?: { w: number; h: number }
  both?: boolean
  filename?: string
  solutionGrid?: Cell[][]
  highlightColor?: string
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

function buildWordLinesFromGrid(grid: Cell[][], cellWidth: number, cellHeight: number): WordLine[] {
  const map = new Map<number, { x: number; y: number }[]>()
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const idx = grid[y][x].wordIndex
      if (idx !== null) {
        if (!map.has(idx)) map.set(idx, [])
        map.get(idx)!.push({ x: x * cellWidth + cellWidth / 2, y: y * cellHeight + cellHeight / 2 })
      }
    }
  }
  const lines: WordLine[] = []
  for (const [, positions] of map) {
    if (positions.length < 2) continue
    positions.sort((a, b) => (a.y - b.y) || (a.x - b.x))
    lines.push({ x1: positions[0].x, y1: positions[0].y, x2: positions[positions.length - 1].x, y2: positions[positions.length - 1].y })
  }
  return lines
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

  const { cells, cols, rows, cellWidth, cellHeight, fontFamily, fontSizePx, gridStyle, wordLines } = data
  const table = tableId ? document.getElementById(tableId) : null
  const highlightColor = opts?.highlightColor || table?.getAttribute("data-highlight-color") || "#9e9e9e"

  let effectiveWordLines = wordLines
  if (drawWordLines && effectiveWordLines.length === 0 && opts?.solutionGrid) {
    effectiveWordLines = buildWordLinesFromGrid(opts.solutionGrid, cellWidth, cellHeight)
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

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${targetW}" height="${targetH}" font-family="${fontFamily}" font-size="${fontSizePx}px">`

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
      svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dy=".35em" fill="#000">${escapeXml(cell.letter)}</text>`
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

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
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
