import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWordSearch } from '@/store'
import { useI18n } from '@/i18n'

interface SaveGenerationModalProps {
  open: boolean
  onOpenChange(open: boolean): void
}

/** Names and persists a complete snapshot of the current generation. */
export function SaveGenerationModal({
  open,
  onOpenChange,
}: SaveGenerationModalProps) {
  const { t } = useI18n()
  const { state, saveGeneration } = useWordSearch()
  const defaultName = t('generationDefaultName', {
    count: state.savedGenerations.length + 1,
  })
  const [name, setName] = useState(defaultName)

  useEffect(() => {
    if (open) setName(defaultName)
  }, [defaultName, open])

  function handleSave() {
    if (state.current === null) return
    saveGeneration(name)
    onOpenChange(false)
    setName(defaultName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('saveGenerationTitle')}</DialogTitle>
          <DialogDescription>
            {t('saveGenerationDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gen-name">{t('name')}</Label>
          <Input
            id="gen-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={defaultName}
            className="h-8 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={state.current === null}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
