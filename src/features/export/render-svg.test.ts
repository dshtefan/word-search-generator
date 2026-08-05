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
      '<line x1="0" y1="0" x2="40" y2="0" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="0" y1="20" x2="40" y2="20" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="0" y1="0" x2="0" y2="20" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="20" y1="0" x2="20" y2="20" stroke="#d1d5db" stroke-width="1" />',
      '<line x1="40" y1="0" x2="40" y2="20" stroke="#d1d5db" stroke-width="1" />',
      '</svg>',
    ].join('\n'))
  })

  test('renders an outer border without internal grid lines', () => {
    const svg = renderSvg({ ...fullDocument, paths: [], gridStyle: 'outer' })

    expect(svg).toContain(
      '<rect x="0" y="0" width="40" height="20" fill="none" stroke="#9ca3af" stroke-width="2" />',
    )
    expect(svg).not.toContain('stroke="#d1d5db"')
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

  test('serializes local font style attributes and escapes CSS/XML boundaries', () => {
    const svg = renderSvg({
      ...fullDocument,
      font: {
        family: 'Local </text> & "Family"',
        size: 18,
        style: 'italic',
        weight: 700,
        localFamily: 'Local "); } </style><script>',
      },
    })

    expect(svg).toContain(
      '<style>@font-face { font-family: &quot;Local \\&quot;); } &lt;/style&gt;&lt;script&gt;&quot;; src: local(&quot;Local \\&quot;); } &lt;/style&gt;&lt;script&gt;&quot;); }</style>',
    )
    expect(svg).toContain('font-style="italic" font-weight="700"')
    expect(svg).not.toContain('<script>')
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
