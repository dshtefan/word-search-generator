import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#ffeb3b", "#ff9800", "#f44336", "#e91e63", "#f06292",
  "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#42a5f5",
  "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a",
  "#cddc39", "#ffc107", "#ff7043", "#795548", "#a1887f",
  "#b0bec5", "#90a4ae", "#78909c", "#607d8b", "#546e7a",
  "#455a64", "#37474f", "#263238", "#e0e0e0", "#bdbdbd",
  "#9e9e9e", "#757575", "#616161", "#424242", "#212121",
  "#ffffff", "#fafafa", "#f5f5f5", "#eeeeee", "#000000",
]

interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-lg border border-input px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50"
            )}
          >
            <div
              className="h-4 w-4 shrink-0 rounded-sm border"
              style={{ backgroundColor: value }}
            />
            <span className="text-muted-foreground text-xs">{value}</span>
          </button>
        }
      />
      <PopoverContent className="w-56 p-3" align="start">
        <div className="grid grid-cols-8 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color)
                setOpen(false)
              }}
              className={cn(
                "h-5 w-5 rounded-sm border border-border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value === color && "ring-2 ring-ring ring-offset-1"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-7 w-7 shrink-0 rounded-md border border-input"
            style={{ backgroundColor: value }}
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                onChange(v)
              }
            }}
            onBlur={(e) => {
              if (e.target.value.length === 7 && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                onChange(e.target.value)
              }
            }}
            className="h-7 flex-1 px-2 font-mono text-xs"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
