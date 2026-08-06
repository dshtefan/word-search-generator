import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  ariaLabel?: string
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  ariaLabel,
}: MultiSelectProps) {
  const triggerLabel =
    selected.length > 0
      ? `${selected.length} selected`
      : placeholder

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full justify-between font-normal"
            aria-label={ariaLabel}
          />
        }
      >
        <span className={cn(!selected.length && "text-muted-foreground")}>
          {triggerLabel}
        </span>
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-1" align="center">
        <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto p-1">
          {options.map((option) => (
            <Label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              {option.label}
            </Label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { MultiSelect }
export type { MultiSelectProps }
