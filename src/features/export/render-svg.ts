import type { ExportDocument, ExportFont } from './types'
import { assertPositiveDimensions } from './geometry'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeCssString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\d ')
    .replace(/\n/g, '\\a ')
    .replace(/\f/g, '\\c ')
}

function getHttpFontUrl(rawUrl: string): string {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new TypeError('Custom font URL must use HTTP or HTTPS')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError('Custom font URL must use HTTP or HTTPS')
  }
  return url.href
}

function renderFontStyles(font: ExportFont): string[] {
  const styles: string[] = []
  if (font.customUrl !== undefined) {
    const url = escapeXml(escapeCssString(getHttpFontUrl(font.customUrl)))
    styles.push(`<style>@import url(&quot;${url}&quot;);</style>`)
  }
  const installedName = font.localFullName?.trim() || font.localFamily?.trim()
  if (installedName) {
    const family = escapeXml(escapeCssString(font.family))
    const source = escapeXml(escapeCssString(installedName))
    styles.push(
      `<style>@font-face { font-family: &quot;${family}&quot;; src: local(&quot;${source}&quot;); }</style>`,
    )
  }
  return styles
}

function renderFullBorders(document: ExportDocument): string[] {
  if (document.cells.length === 0) return []

  const inset = 0.5
  const horizontalBoundaries = [
    inset,
    ...new Set(document.cells.map((cell) => cell.y).filter((y) => y > 0)),
    document.height - inset,
  ].sort((a, b) => a - b)
  const verticalBoundaries = [
    inset,
    ...new Set(document.cells.map((cell) => cell.x).filter((x) => x > 0)),
    document.width - inset,
  ].sort((a, b) => a - b)

  return [
    ...horizontalBoundaries.map(
      (y) => `<line x1="${inset}" y1="${y}" x2="${document.width - inset}" y2="${y}" stroke="#d1d5db" stroke-width="1" />`,
    ),
    ...verticalBoundaries.map(
      (x) => `<line x1="${x}" y1="${inset}" x2="${x}" y2="${document.height - inset}" stroke="#d1d5db" stroke-width="1" />`,
    ),
  ]
}

function renderBorders(document: ExportDocument): string[] {
  if (document.gridStyle === 'full') return renderFullBorders(document)
  if (document.gridStyle === 'outer') {
    const inset = 1
    return [
      `<rect x="${inset}" y="${inset}" width="${document.width - inset * 2}" height="${document.height - inset * 2}" fill="none" stroke="#9ca3af" stroke-width="2" />`,
    ]
  }
  return []
}

/** Serializes an export document as SVG without accessing browser rendering state. */
export function renderSvg(document: ExportDocument): string {
  assertPositiveDimensions(document)
  const fontAttributes = [
    `font-family="${escapeXml(document.font.family)}"`,
    `font-size="${document.font.size}"`,
    ...(document.font.style === undefined
      ? []
      : [`font-style="${document.font.style}"`]),
    ...(document.font.weight === undefined
      ? []
      : [`font-weight="${document.font.weight}"`]),
  ].join(' ')
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}" ${fontAttributes}>`,
    ...renderFontStyles(document.font),
    `<rect x="0" y="0" width="${document.width}" height="${document.height}" fill="#fff" />`,
    ...document.paths.map(
      (path) => `<line x1="${path.x1}" y1="${path.y1}" x2="${path.x2}" y2="${path.y2}" stroke="${escapeXml(document.highlightColor)}" stroke-width="${path.strokeWidth}" stroke-linecap="round" opacity="0.6" />`,
    ),
    ...document.cells.map((cell) =>
      `<text x="${cell.x + cell.width / 2}" y="${cell.y + cell.height / 2}" text-anchor="middle" dominant-baseline="central" fill="#000">${escapeXml(cell.letter)}</text>`,
    ),
    ...renderBorders(document),
    '</svg>',
  ]

  return lines.join('\n')
}
