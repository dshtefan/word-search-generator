import { GridSizeInputs } from '@/components/GridSizeInputs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorPicker } from '@/components/ui/color-picker'
import { useWordSearch } from '@/store'
import { useI18n } from '@/i18n'

/** Renders grid dimensions followed by the highlight-color card. */
export function GridSection() {
  const { t } = useI18n()
  const { state, updateAppearance, updateGeneration } = useWordSearch()
  const { generation, appearance } = state.settings

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('gridSize')}</CardTitle>
        </CardHeader>
        <CardContent>
          <GridSizeInputs
            gridX={generation.width}
            gridY={generation.height}
            onGridXChange={(width) => updateGeneration({ width })}
            onGridYChange={(height) => updateGeneration({ height })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('highlightColor')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <ColorPicker
            value={appearance.highlightColor}
            onChange={(highlightColor) => updateAppearance({ highlightColor })}
          />
        </CardContent>
      </Card>
    </>
  )
}
