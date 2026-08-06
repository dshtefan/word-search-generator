import { useState } from 'react'
import { SaveGenerationModal } from '@/components/modals/SaveGenerationModal'
import { SaveModal } from '@/components/modals/SaveModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useWordSearch } from '@/store'
import { useI18n } from '@/i18n'
import type { MessageKey } from '@/i18n'
import type { WordSearchErrorCode } from '@/domain/word-search'

const GENERATION_ERROR_KEYS: Readonly<Record<
  WordSearchErrorCode | 'UNKNOWN',
  MessageKey
>> = {
  NO_WORDS: 'generationNoWords',
  NO_DIRECTIONS: 'generationNoDirections',
  INVALID_DIMENSIONS: 'generationInvalidDimensions',
  WORD_DOES_NOT_FIT: 'generationWordDoesNotFit',
  PLACEMENT_EXHAUSTED: 'generationPlacementExhausted',
  UNKNOWN: 'generationUnknown',
}

/** Renders generation, snapshot, export, and reset actions. */
export function ActionsSection() {
  const { t } = useI18n()
  const { state, generate, reset } = useWordSearch()
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveGenerationOpen, setSaveGenerationOpen] = useState(false)
  const isGenerated = state.current !== null

  return (
    <>
      <Card className="shrink-0">
        <CardContent className="flex flex-col gap-2">
          <Button onClick={generate} disabled={state.status === 'generating'}>
            {state.status === 'generating' ? t('generating') : t('generate')}
          </Button>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {t(GENERATION_ERROR_KEYS[state.error])}
            </p>
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
            {t('saveGeneration')}
          </Button>
          <Button
            variant="outline"
            disabled={!isGenerated}
            onClick={() => setSaveOpen(true)}
          >
            {t('save')}
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            {t('resetToDefaults')}
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
