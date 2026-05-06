import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { XIcon } from "lucide-react"

interface GridSizeInputsProps {
  gridX: number
  gridY: number
  onGridXChange: (value: number) => void
  onGridYChange: (value: number) => void
}

function GridSizeInputs({
  gridX,
  gridY,
  onGridXChange,
  onGridYChange,
}: GridSizeInputsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          min={5}
          max={30}
          value={gridX}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10)
            if (!Number.isNaN(v)) onGridXChange(v)
          }}
          className="w-20"
          aria-label="Grid width"
        />
        <XIcon className="size-4 shrink-0 text-muted-foreground" />
        <Input
          type="number"
          min={5}
          max={30}
          value={gridY}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10)
            if (!Number.isNaN(v)) onGridYChange(v)
          }}
          className="w-20"
          aria-label="Grid height"
        />
      </div>
    </div>
  )
}

export { GridSizeInputs }
export type { GridSizeInputsProps }
