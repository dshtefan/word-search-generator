import { useState } from "react"
import { useWordSearch } from "@/context/WordSearchContext"
import { SaveModal } from "@/components/SaveModal"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function SavedPanel() {
  const { savedGenerations, removeSaved, applySaved } = useWordSearch()
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportOpen, setExportOpen] = useState(false)

  const selected = savedGenerations.filter(sg => selectedIds.has(sg.id))
  const allSelected = savedGenerations.length > 0 && selected.length === savedGenerations.length
  const someSelected = selected.length > 0 && selected.length < savedGenerations.length

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(savedGenerations.map(sg => sg.id)))
    }
  }

  function toggleId(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger>
          <Button variant="ghost" size="sm" className="rounded-full h-7 w-7 p-0 text-sm text-green-600">
            Generations {savedGenerations.length}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-[70vh] flex flex-col p-0" side="top" align="end">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={() => toggleAll()}
              />
              <span className="font-medium text-sm">Saved Generations</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setOpen(false)}>
              &times;
            </Button>
          </div>
          {savedGenerations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No saved generations yet
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {savedGenerations.map((sg) => (
                <div
                  key={sg.id}
                  className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedIds.has(sg.id)}
                    onCheckedChange={() => toggleId(sg.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{sg.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {sg.words.length} words, {sg.grid ? `${sg.grid[0].length}x${sg.grid.length}` : '0x0'}, {sg.fontFamily}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                    title="Apply"
                    onClick={() => {
                      applySaved(sg)
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
                    onClick={() => removeSaved(sg.id)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="px-3 py-2 border-t">
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
