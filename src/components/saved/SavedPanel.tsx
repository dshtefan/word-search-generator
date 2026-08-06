import { useState } from 'react'
import { SaveModal } from '@/components/modals/SaveModal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getGridDimensions } from '@/components/preview/grid-dimensions'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useWordSearch } from '@/store/WordSearchProvider'

/** Lists saved snapshots and offers apply, remove, selection, and export intents. */
export function SavedPanel() {
  const { state, applySaved, removeSaved } = useWordSearch()
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)
  const savedGenerations = state.savedGenerations
  const selected = savedGenerations.filter(({ id }) => selectedIds.has(id))
  const allSelected = savedGenerations.length > 0
    && selected.length === savedGenerations.length
  const someSelected = selected.length > 0
    && selected.length < savedGenerations.length

  function toggleAll() {
    setSelectedIds(allSelected
      ? new Set()
      : new Set(savedGenerations.map(({ id }) => id)))
  }

  function toggleId(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function deleteSaved(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous)
      next.delete(id)
      return next
    })
    removeSaved(id)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 rounded-full p-0 text-sm text-green-600"
            />
          }
        >
          Generations {savedGenerations.length}
        </PopoverTrigger>
        <PopoverContent
          className="flex max-h-[70vh] w-80 flex-col p-0"
          side="top"
          align="end"
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">Saved Generations</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setOpen(false)}
            >
              &times;
            </Button>
          </div>
          {savedGenerations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No saved generations yet
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {savedGenerations.map((saved) => {
                const dimensions = getGridDimensions(saved.result.puzzle)
                return (
                  <div
                    key={saved.id}
                    className="flex items-center gap-2 border-b px-3 py-2 last:border-b-0 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedIds.has(saved.id)}
                      onCheckedChange={() => toggleId(saved.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{saved.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {saved.settings.generation.words.length} words,{' '}
                        {dimensions?.columns ?? 0}x{dimensions?.rows ?? 0},{' '}
                        {saved.settings.appearance.fontFamily}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                      title="Apply"
                      onClick={() => {
                        applySaved(saved.id)
                        setOpen(false)
                      }}
                    >
                      &#8635;
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-1.5 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => deleteSaved(saved.id)}
                    >
                      &times;
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
          <div className="border-t px-3 py-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={selected.length === 0}
              onClick={() => {
                setExportOpen(true)
                setOpen(false)
              }}
            >
              Export selected ({selected.length})
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <SaveModal
        mode="saved"
        savedList={selected}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </>
  )
}
