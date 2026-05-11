import { useState, useLayoutEffect, useRef, useCallback } from 'react'
import { useWordSearch } from '@/context/WordSearchContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WordSearchGrid } from '@/components/WordSearchGrid'

function parseFontStyle(style: string): { fontStyle?: string; fontWeight?: number } {
  const s = style.toLowerCase()
  const result: { fontStyle?: string; fontWeight?: number } = {}
  if (s.includes('italic')) result.fontStyle = 'italic'
  if (s.includes('bold')) result.fontWeight = 700
  else if (s.includes('thin')) result.fontWeight = 100
  else if (s.includes('extralight') || s.includes('ultra light')) result.fontWeight = 200
  else if (s.includes('light')) result.fontWeight = 300
  else if (s.includes('medium')) result.fontWeight = 500
  else if (s.includes('semibold')) result.fontWeight = 600
  else if (s.includes('extrabold') || s.includes('ultra bold')) result.fontWeight = 800
  else if (s.includes('black') || s.includes('heavy')) result.fontWeight = 900
  return result
}

export function Preview() {
  const { state } = useWordSearch()
  const [activeTab, setActiveTab] = useState('with-answers')
  const measureRef = useRef<HTMLDivElement>(null)
  const [availW, setAvailW] = useState(0)
  const [availH, setAvailH] = useState(0)

  const measure = useCallback(() => {
    if (!measureRef.current) return
    const el = measureRef.current
    setAvailW(Math.floor(el.clientWidth * 0.8))
    setAvailH(Math.floor(el.clientHeight * 0.8))
  }, [])

  useLayoutEffect(() => {
    measure()
    const onResize = () => measure()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measure])

  // Re-measure when grid changes (which changes the container size)
  useLayoutEffect(() => { measure() }, [measure, state.grid, state.solutionGrid])

  if (!state.grid) {
    return (
      <p className="text-muted-foreground">
        Click Generate to create a word search
      </p>
    )
  }

  const grid = state.grid ?? state.solutionGrid
  const cols = grid[0].length
  const rows = grid.length
  let cellWidthOverride: number | undefined
  let cellHeightOverride: number | undefined

  if (state.useResolution && availW > 0 && availH > 0) {
    const scale = Math.min(availW / state.resolutionW, availH / state.resolutionH)
    const targetW = Math.floor(state.resolutionW * scale)
    const targetH = Math.floor(state.resolutionH * scale)
    cellWidthOverride = Math.max(8, targetW / cols)
    cellHeightOverride = Math.max(8, targetH / rows)
  } else if (state.useAspectRatio && availW > 0 && availH > 0) {
    const ratio = state.aspectRatioW / state.aspectRatioH
    let fitW = availW
    let fitH = availW / ratio
    if (fitH > availH) {
      fitH = availH
      fitW = availH * ratio
    }
    cellWidthOverride = Math.max(8, fitW / cols)
    cellHeightOverride = Math.max(8, fitH / rows)
  }

  const gridProps = {
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    highlightColor: state.highlightColor,
    gridStyle: state.gridStyle,
    cellWidthOverride,
    cellHeightOverride,
    ...parseFontStyle(state.useLocalFont ? state.localFontStyle : ''),
  } as const

  const renderedCols = grid[0].length
  const renderedRows = grid.length
  const renderedW = Math.round((cellWidthOverride ?? state.fontSize + 8) * renderedCols)
  const renderedH = Math.round((cellHeightOverride ?? state.fontSize + 8) * renderedRows)
  const hasTarget = state.useResolution || state.useAspectRatio

  const gridContent = (
    <WordSearchGrid grid={state.grid} words={state.words} placements={state.placements} showAnswers={false} tableId="word-search-grid-content" {...gridProps} />
  )

  const solutionContent = (
    <WordSearchGrid
      grid={state.solutionGrid ?? state.grid}
      words={state.words}
      placements={state.placements}
      showAnswers
      tableId="word-search-grid-content"
      {...gridProps}
    />
  )

  return (
    <div ref={measureRef} className="relative flex h-full w-full items-center justify-center">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col items-center gap-4">
        <TabsList className="h-10 p-1">
          <TabsTrigger value="no-answers" className="px-4 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground">
            Без ответов
          </TabsTrigger>
          <TabsTrigger value="with-answers" className="px-4 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground">
            С ответами
          </TabsTrigger>
        </TabsList>
        <TabsContent value="no-answers" className="flex justify-center">
          {gridContent}
        </TabsContent>
        <TabsContent value="with-answers" className="flex justify-center">
          {solutionContent}
        </TabsContent>
      </Tabs>
      {hasTarget && (
        <span className="pointer-events-none absolute bottom-2 left-3 select-none text-xs text-muted-foreground/50">
          {renderedCols}×{renderedRows}
          {state.useResolution && <> → {state.resolutionW}×{state.resolutionH}</>}
          {state.useAspectRatio && <> → {state.aspectRatioW}:{state.aspectRatioH}</>}
          {' @ '}{renderedW}×{renderedH}px
        </span>
      )}
    </div>
  )
}
