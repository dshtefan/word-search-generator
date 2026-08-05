import { useState } from 'react'
import { SaveGenerationModal } from '@/components/modals/SaveGenerationModal'
import { SaveModal } from '@/components/modals/SaveModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWordSearch } from '@/store/WordSearchProvider'

/** Renders generation, snapshot, export, and reset actions. */
export function ActionsSection() {
  const { state, generate, reset } = useWordSearch()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveGenerationOpen, setSaveGenerationOpen] = useState(false)
  const isGenerated = state.current !== null

  return (
    <>
      <Card className="shrink-0">
        <CardContent className="flex flex-col gap-2">
          <Button onClick={generate} disabled={state.status === 'generating'}>
            {state.status === 'generating' ? 'Generating...' : 'Generate'}
          </Button>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {isGenerated && state.settings.generation.words.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.settings.generation.words.map((word, index) => (
                <span
                  key={index}
                  className="rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  {word}
                </span>
              ))}
            </div>
          )}
          <Button
            variant="secondary"
            disabled={!isGenerated}
            onClick={() => setSaveGenerationOpen(true)}
          >
            Save generation
          </Button>
          <Button
            variant="outline"
            disabled={!isGenerated}
            onClick={() => setSaveOpen(true)}
          >
            Save
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset to defaults
          </Button>
        </CardContent>
      </Card>
      <SaveGenerationModal
        open={saveGenerationOpen}
        onOpenChange={setSaveGenerationOpen}
      />
      <SaveModal open={saveOpen} onOpenChange={setSaveOpen} />
    </>
  )
}
