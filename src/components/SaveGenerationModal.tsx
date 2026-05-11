import { useState } from "react"
import { useWordSearch } from "@/context/WordSearchContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SaveGenerationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveGenerationModal({ open, onOpenChange }: SaveGenerationModalProps) {
  const { state, savedGenerations, addSaved } = useWordSearch()
  const defaultName = `Generation ${savedGenerations.length + 1}`
  const [name, setName] = useState(defaultName)

  function handleSave() {
    if (!state.isGenerated) return
    const gen = {
      id: crypto.randomUUID(),
      name: name.trim() || defaultName,
      grid: state.grid,
      solutionGrid: state.solutionGrid,
      placements: state.placements,
      words: state.words,
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      highlightColor: state.highlightColor,
      gridStyle: state.gridStyle,
      createdAt: Date.now(),
    }
    addSaved(gen)
    onOpenChange(false)
    setName(defaultName)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Generation</DialogTitle>
          <DialogDescription>
            Save the current word search with a custom name.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="gen-name">Name</Label>
          <Input
            id="gen-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="h-8 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!state.isGenerated}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
