import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExportFormat } from '@/features/export/types'
import type { ExportErrorCode } from '@/features/export/types'
import type { SavedGeneration } from '@/features/saved-generations/types'
import { useWordSearch } from '@/store'
import { useI18n } from '@/i18n'
import type { MessageKey } from '@/i18n'

const EXPORT_ERROR_KEYS: Readonly<Record<ExportErrorCode, MessageKey>> = {
  NO_VARIANTS: 'exportNoVariants',
  CURRENT_EXPORT_FAILED: 'exportCurrentFailed',
  NO_SAVED: 'exportNoSaved',
  SAVED_EXPORT_FAILED: 'exportSavedFailed',
}

interface SaveModalProps {
  open: boolean
  onOpenChange(open: boolean): void
  mode?: 'current' | 'saved'
  savedList?: readonly SavedGeneration[]
}

/** Exports current or saved snapshots and keeps typed failures inside the dialog. */
export function SaveModal({
  open,
  onOpenChange,
  mode = 'current',
  savedList = [],
}: SaveModalProps) {
  const { t } = useI18n()
  const { state, exportService } = useWordSearch()
  const [format, setFormat] = useState<ExportFormat>('svg')
  const [isExporting, setIsExporting] = useState(false)
  const [downloadBoth, setDownloadBoth] = useState(true)
  const [filename, setFilename] = useState('ws')
  const [error, setError] = useState<string | null>(null)
  const activeAttempt = useRef(0)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      activeAttempt.current += 1
      setError(null)
      setIsExporting(false)
    }
    onOpenChange(nextOpen)
  }

  async function handleSave() {
    const attempt = activeAttempt.current + 1
    activeAttempt.current = attempt
    setError(null)
    setIsExporting(true)
    try {
      const exportFilename = filename.trim() || 'ws'
      const result = mode === 'saved'
        ? await exportService.exportSaved({
          snapshots: savedList,
          format,
        })
        : state.current === null
          ? null
          : await exportService.exportCurrent({
            source: {
              id: 'current',
              name: exportFilename,
              createdAt: 0,
              settings: state.settings,
              result: state.current,
            },
            format,
            filename: exportFilename,
            includeAnswers: true,
            includePuzzle: downloadBoth,
          })

      if (attempt !== activeAttempt.current || result === null) return
      if ('code' in result) {
        setError(t(EXPORT_ERROR_KEYS[result.code]))
        return
      }
      handleOpenChange(false)
    } catch {
      if (attempt === activeAttempt.current) setError(t('exportUnexpected'))
    } finally {
      if (attempt === activeAttempt.current) setIsExporting(false)
    }
  }

  const currentUnavailable = mode === 'current' && state.current === null
  const savedUnavailable = mode === 'saved' && savedList.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('saveWordSearch')}</DialogTitle>
          <DialogDescription>
            {mode === 'saved'
              ? t('exportSavedDescription', { count: savedList.length })
              : t('exportCurrentDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="format-select">{t('format')}</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ExportFormat)}
            >
              <SelectTrigger id="format-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="svg">SVG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === 'current' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filename-input">{t('fileName')}</Label>
              <Input
                id="filename-input"
                type="text"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                placeholder="ws"
                className="h-8 text-sm"
              />
            </div>
          )}
          {mode === 'current' && (
            <div className="flex flex-col gap-2">
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={downloadBoth}
                  onCheckedChange={(checked) => setDownloadBoth(!!checked)}
                />
                {t('downloadBoth')}
              </Label>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={currentUnavailable || savedUnavailable || isExporting}
          >
            {isExporting
              ? t('saving')
              : mode === 'saved'
                ? t('exportGenerations', { count: savedList.length })
                : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
