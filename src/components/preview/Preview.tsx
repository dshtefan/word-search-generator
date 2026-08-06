import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { parseFontStyle } from '@/shared/font-style'
import { useWordSearch } from '@/store'
import { WordSearchGrid } from './WordSearchGrid'
import { getGridDimensions } from './grid-dimensions'
import { useI18n } from '@/i18n'

/** Displays puzzle and answer tabs while fitting optional output dimensions. */
export function Preview() {
  const { t } = useI18n()
  const { state } = useWordSearch()
  const [activeTab, setActiveTab] = useState('with-answers')
  const measureRef = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  const [availableHeight, setAvailableHeight] = useState(0)
  const measure = useCallback(() => {
    const element = measureRef.current
    if (!element) return
    setAvailableWidth(Math.floor(element.clientWidth * 0.8))
    setAvailableHeight(Math.floor(element.clientHeight * 0.8))
  }, [])

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])
  useLayoutEffect(measure)

  const puzzleDimensions = state.current === null
    ? null
    : getGridDimensions(state.current.puzzle)
  const solutionDimensions = state.current === null
    ? null
    : getGridDimensions(state.current.solution)

  if (state.current === null
    || puzzleDimensions === null
    || solutionDimensions === null
  ) {
    return (
      <p className="text-muted-foreground">
        {t('previewEmpty')}
      </p>
    )
  }

  const { appearance, output } = state.settings
  const { columns, rows } = puzzleDimensions
  let cellWidthOverride: number | undefined
  let cellHeightOverride: number | undefined

  if (output.mode === 'resolution' && availableWidth > 0 && availableHeight > 0) {
    const scale = Math.min(
      availableWidth / output.resolution.width,
      availableHeight / output.resolution.height,
    )
    cellWidthOverride = Math.max(
      8,
      Math.floor(output.resolution.width * scale) / columns,
    )
    cellHeightOverride = Math.max(
      8,
      Math.floor(output.resolution.height * scale) / rows,
    )
  } else if (output.mode === 'aspect-ratio'
    && availableWidth > 0
    && availableHeight > 0
  ) {
    const ratio = output.aspectRatio.width / output.aspectRatio.height
    let fitWidth = availableWidth
    let fitHeight = availableWidth / ratio
    if (fitHeight > availableHeight) {
      fitHeight = availableHeight
      fitWidth = availableHeight * ratio
    }
    cellWidthOverride = Math.max(8, fitWidth / columns)
    cellHeightOverride = Math.max(8, fitHeight / rows)
  }

  const gridProps = {
    fontFamily: appearance.fontFamily,
    fontSize: appearance.fontSize,
    highlightColor: appearance.highlightColor,
    gridStyle: appearance.gridStyle,
    cellWidthOverride,
    cellHeightOverride,
    ...parseFontStyle(appearance.localFont.enabled
      ? appearance.localFont.style
      : ''),
  } as const
  const renderedWidth = Math.round(
    (cellWidthOverride ?? appearance.fontSize + 8) * columns,
  )
  const renderedHeight = Math.round(
    (cellHeightOverride ?? appearance.fontSize + 8) * rows,
  )

  return (
    <div
      ref={measureRef}
      className="relative flex h-full w-full items-center justify-center"
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col items-center gap-4"
      >
        <TabsList className="h-10 p-1">
          <TabsTrigger
            value="no-answers"
            className="px-4 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground"
          >
            {t('withoutAnswers')}
          </TabsTrigger>
          <TabsTrigger
            value="with-answers"
            className="px-4 text-base font-semibold data-active:bg-primary data-active:text-primary-foreground"
          >
            {t('withAnswers')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="no-answers" className="flex justify-center">
          <WordSearchGrid
            grid={state.current.puzzle}
            placements={state.current.placements}
            showAnswers={false}
            {...gridProps}
          />
        </TabsContent>
        <TabsContent value="with-answers" className="flex justify-center">
          <WordSearchGrid
            grid={state.current.solution}
            placements={state.current.placements}
            showAnswers
            {...gridProps}
          />
        </TabsContent>
      </Tabs>
      {output.mode !== 'natural' && (
        <span className="pointer-events-none absolute bottom-2 left-3 select-none text-xs text-muted-foreground/50">
          {columns}×{rows}
          {output.mode === 'resolution' && (
            <> → {output.resolution.width}×{output.resolution.height}</>
          )}
          {output.mode === 'aspect-ratio' && (
            <> → {output.aspectRatio.width}:{output.aspectRatio.height}</>
          )}
          {' @ '}{renderedWidth}×{renderedHeight}px
        </span>
      )}
    </div>
  )
}
