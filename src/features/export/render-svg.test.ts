/** @jest-environment node */

import type { ExportDocument } from './types'
import { renderSvg } from './render-svg'

const fullDocument: ExportDocument = {
  width: 40,
  height: 20,
  cells: [
    { letter: '&<>"', x: 0, y: 0, width: 20, height: 20 },
    { letter: 'B', x: 20, y: 0, width: 20, height: 20 },
  ],
  paths: [
    { wordIndex: 7, x1: 10, y1: 10, x2: 30, y2: 10, strokeWidth: 14 },
  ],
  font: { family: 'A & <B> "C"', size: 12 },
  highlightColor: '#f00&"',
  gridStyle: 'full',
}

describe('renderSvg', () => {
  test('serializes dimensions, escaped text, positions, and every full-grid border', () => {
    expect(renderSvg(fullDocument)).toBe([
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20" font-family="A &amp; &lt;B&gt; &quot;C&quot;" font-size="12">',
      '<rect x="0" y="0" width="40" height="20" fill="#fff" />',
      '<line x1="10" y1="10" x2="30" y2="10" stroke="#f00&amp;&quot;" stroke-width="14" stroke-linecap="round" opacity="0.6" />',
      '<text x="10" y="10" text-anchor="middle" dominant-baseline="central" fill="#000">&amp;&lt;&gt;&quot;</text>',
      '<text x="30" y="10" text-anchor="middle" dominant-baseline="central" fill="#000">B</text>',
      '<line x1="0.5" y1="0.5" x2="39.5" y2="0.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="0.5" y1="19.5" x2="39.5" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="0.5" y1="0.5" x2="0.5" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="20" y1="0.5" x2="20" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="39.5" y1="0.5" x2="39.5" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '</svg>',
    ].join('\n'))
  })

  test('renders an outer border without internal grid lines', () => {
    const svg = renderSvg({ ...fullDocument, paths: [], gridStyle: 'outer' })

    expect(svg).toContain(
      '<rect x="1" y="1" width="38" height="18" fill="none" stroke="#9ca3af" stroke-width="2" />',
    )
    expect(svg).not.toContain('stroke="#d1d5db"')
  })

  test('emits one canonical vertical border per boundary for seven columns', () => {
    const cellWidth = 120 / 7
    const cells = Array.from({ length: 7 }, (_, column) => ({
      letter: String(column),
      x: column * cellWidth,
      y: 0,
      width: cellWidth,
      height: 20,
    }))

    const svg = renderSvg({
      ...fullDocument,
      width: 120,
      cells,
      paths: [],
    })
    const verticalBorders = svg.split('\n').filter((line) =>
      /<line x1="([^"]+)" y1="0\.5" x2="\1" y2="19\.5"/.test(line),
    )

    expect(verticalBorders).toEqual([
      '<line x1="0.5" y1="0.5" x2="0.5" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="17.142857142857142" y1="0.5" x2="17.142857142857142" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="34.285714285714285" y1="0.5" x2="34.285714285714285" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="51.42857142857143" y1="0.5" x2="51.42857142857143" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="68.57142857142857" y1="0.5" x2="68.57142857142857" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="85.71428571428571" y1="0.5" x2="85.71428571428571" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="102.85714285714286" y1="0.5" x2="102.85714285714286" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="119.5" y1="0.5" x2="119.5" y2="19.5" stroke="#d1d5db" stroke-width="1" />',
    ])
  })

  test('renders no borders and no answer paths for a puzzle document', () => {
    const svg = renderSvg({ ...fullDocument, paths: [], gridStyle: 'none' })

    expect(svg).not.toContain('<line')
    expect(svg).not.toContain('fill="none"')
    expect(svg).toContain('<rect x="0" y="0" width="40" height="20" fill="#fff" />')
  })

  test('places answer lines before letters so text remains legible', () => {
    const svg = renderSvg(fullDocument)

    expect(svg.indexOf('stroke="#f00&amp;&quot;"')).toBeLessThan(
      svg.indexOf('<text'),
    )
  })

  test('uses the precise local font name and escapes CSS/XML boundaries', () => {
    const svg = renderSvg({
      ...fullDocument,
      font: {
        family: 'Local </text> & "Family"',
        size: 18,
        style: 'italic',
        weight: 700,
        localFullName: 'Precise "); } </style><script>',
      },
    })

    expect(svg).toContain(
      '<style>@font-face { font-family: &quot;Precise \\&quot;); } &lt;/style&gt;&lt;script&gt;&quot;; src: local(&quot;Precise \\&quot;); } &lt;/style&gt;&lt;script&gt;&quot;); }</style>',
    )
    expect(svg).toContain('font-style="italic" font-weight="700"')
    expect(svg).not.toContain('<script>')
  })

  test('falls back to the local family when no full name is available', () => {
    const svg = renderSvg({
      ...fullDocument,
      font: { family: 'Family fallback', size: 12, localFamily: 'Family fallback' },
    })

    expect(svg).toContain(
      '<style>@font-face { font-family: &quot;Family fallback&quot;; src: local(&quot;Family fallback&quot;); }</style>',
    )
  })

  test('imports an HTTP custom font with escaped URL content', () => {
    const svg = renderSvg({
      ...fullDocument,
      font: {
        family: 'Remote',
        size: 12,
        customUrl: 'https://example.com/font.css?family=A&B',
      },
    })

    expect(svg).toContain(
      '<style>@import url(&quot;https://example.com/font.css?family=A&amp;B&quot;);</style>',
    )
  })

  test.each([
    'javascript:alert(1)',
    'data:text/css,body{}',
    'file:///tmp/font.css',
    'not a URL',
  ])('rejects the non-HTTP(S) custom font URL %s', (customUrl) => {
    expect(() => renderSvg({
      ...fullDocument,
      font: { family: 'Unsafe', size: 12, customUrl },
    })).toThrow('Custom font URL must use HTTP or HTTPS')
  })
})
