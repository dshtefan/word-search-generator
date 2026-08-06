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
import type { SavedGeneration } from '@/features/saved-generations/types'
import { useWordSearch } from '@/store/WordSearchProvider'

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
      if ('message' in result) {
        setError(result.message)
        return
      }
      handleOpenChange(false)
    } catch (cause: unknown) {
      if (attempt === activeAttempt.current) {
        setError(cause instanceof Error
          ? cause.message
          : 'Unable to export word search')
      }
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
          <DialogTitle>Save Word Search</DialogTitle>
          <DialogDescription>
            {mode === 'saved'
              ? `Export ${savedList.length} saved generation${savedList.length !== 1 ? 's' : ''}.`
              : 'Choose a format and download the current word search grid.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="format-select">Format</Label>
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
              <Label htmlFor="filename-input">File name</Label>
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
                Download both (with &amp; without answers)
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
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={currentUnavailable || savedUnavailable || isExporting}
          >
            {isExporting
              ? 'Saving...'
              : mode === 'saved'
                ? `Export ${savedList.length} generation${savedList.length !== 1 ? 's' : ''}`
                : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
