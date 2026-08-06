import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useWordSearch } from '@/store'

interface BalanceSliderProps {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
}

/** Renders one accessible percentage slider with its current value. */
function BalanceSlider({ label, value, onChange }: BalanceSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={label}>{label}</Label>
        <output className="text-xs tabular-nums text-muted-foreground">{value}%</output>
      </div>
      <input
        id={label}
        aria-label={label}
        className="h-2 w-full cursor-pointer accent-primary"
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

/** Controls the soft crossing and spatial-distribution weights used by generation. */
export function GenerationBalanceSection() {
  const { state, updateGeneration } = useWordSearch()
  const { crossingPreference, spreadStrength } = state.settings.generation

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <BalanceSlider
          label="Crossing preference"
          value={crossingPreference}
          onChange={(value) => updateGeneration({ crossingPreference: value })}
        />
        <BalanceSlider
          label="Spread strength"
          value={spreadStrength}
          onChange={(value) => updateGeneration({ spreadStrength: value })}
        />
      </CardContent>
    </Card>
  )
}
