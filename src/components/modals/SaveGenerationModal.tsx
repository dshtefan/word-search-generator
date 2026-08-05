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
import { useWordSearch } from '@/store/WordSearchProvider'

interface SaveGenerationModalProps {
  open: boolean
  onOpenChange(open: boolean): void
}

/** Names and persists a complete snapshot of the current generation. */
export function SaveGenerationModal({
  open,
  onOpenChange,
}: SaveGenerationModalProps) {
  const { state, saveGeneration } = useWordSearch()
  const defaultName = `Generation ${state.savedGenerations.length + 1}`
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
            onChange={(event) => setName(event.target.value)}
            placeholder={defaultName}
            className="h-8 text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={state.current === null}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
