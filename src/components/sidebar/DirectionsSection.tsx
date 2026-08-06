import { MultiSelect } from '@/components/MultiSelect'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import type { Direction } from '@/domain/word-search'
import { useWordSearch } from '@/store'

const CARDINAL_OPTIONS = [
  { value: 'up', label: '↑ Up' },
  { value: 'down', label: '↓ Down' },
  { value: 'left', label: '← Left' },
  { value: 'right', label: '→ Right' },
]
const DIAGONAL_OPTIONS = [
  { value: 'up-left', label: '↖ Up-Left' },
  { value: 'up-right', label: '↗ Up-Right' },
  { value: 'down-left', label: '↙ Down-Left' },
  { value: 'down-right', label: '↘ Down-Right' },
]

/** Renders cardinal and diagonal placement direction controls. */
export function DirectionsSection() {
  const { state, updateGeneration } = useWordSearch()
  const generation = state.settings.generation

  return (
    <Card>
      <CardHeader>
        <CardTitle>Directions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Cardinal</Label>
          <MultiSelect
            ariaLabel="Cardinal directions"
            options={CARDINAL_OPTIONS}
            selected={generation.cardinalDirections}
            onChange={(selected) => updateGeneration({
              cardinalDirections: selected as Direction[],
            })}
            placeholder="Select directions..."
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Diagonal</Label>
          <MultiSelect
            ariaLabel="Diagonal directions"
            options={DIAGONAL_OPTIONS}
            selected={generation.diagonalDirections}
            onChange={(selected) => updateGeneration({
              diagonalDirections: selected as Direction[],
            })}
            placeholder="Select directions..."
          />
        </div>
      </CardContent>
    </Card>
  )
}
