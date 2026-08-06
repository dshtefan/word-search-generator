import { MultiSelect } from '@/components/MultiSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { Direction } from '@/domain/word-search'
import { useI18n } from '@/i18n'
import { useWordSearch } from '@/store'

/** Renders cardinal and diagonal placement direction controls. */
export function DirectionsSection() {
  const { t } = useI18n()
  const { state, updateGeneration } = useWordSearch()
  const generation = state.settings.generation
  const cardinalOptions = [
    { value: 'up', label: t('directionUp') },
    { value: 'down', label: t('directionDown') },
    { value: 'left', label: t('directionLeft') },
    { value: 'right', label: t('directionRight') },
  ]
  const diagonalOptions = [
    { value: 'up-left', label: t('directionUpLeft') },
    { value: 'up-right', label: t('directionUpRight') },
    { value: 'down-left', label: t('directionDownLeft') },
    { value: 'down-right', label: t('directionDownRight') },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('directions')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t('cardinal')}</Label>
          <MultiSelect
            ariaLabel={t('cardinalDirections')}
            options={cardinalOptions}
            selected={generation.cardinalDirections}
            onChange={(selected) => updateGeneration({
              cardinalDirections: selected as Direction[],
            })}
            placeholder={t('selectDirections')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t('diagonal')}</Label>
          <MultiSelect
            ariaLabel={t('diagonalDirections')}
            options={diagonalOptions}
            selected={generation.diagonalDirections}
            onChange={(selected) => updateGeneration({
              diagonalDirections: selected as Direction[],
            })}
            placeholder={t('selectDirections')}
          />
        </div>
      </CardContent>
    </Card>
  )
}
