import { useState, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { RefreshCwIcon, SearchIcon } from "lucide-react"

interface SystemFontPickerProps {
  value: string
  onChange: (family: string) => void
}

export function SystemFontPicker({ value, onChange }: SystemFontPickerProps) {
  const [open, setOpen] = useState(false)
  const [fonts, setFonts] = useState<FontData[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  const loadFonts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.queryLocalFonts()
      const unique = new Map<string, FontData>()
      for (const f of result) {
        const key = f.family + "_" + f.style
        if (!unique.has(key)) unique.set(key, f)
      }
      setFonts([...unique.values()].sort((a, b) => a.family.localeCompare(b.family)))
    } catch (err) {
      console.error("Local font access denied:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  function refreshFonts() {
    setFonts([])
    loadFonts()
  }

  const filtered = search
    ? fonts.filter((f) => f.family.toLowerCase().includes(search.toLowerCase()))
    : fonts

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) loadFonts() }}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-8 w-full justify-start px-2.5 text-xs font-normal"
          />
        }
      >
        {value || "Choose a system font..."}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-7 pl-7 pr-2 text-xs"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={refreshFonts}
            disabled={loading}
            title="Refresh system fonts"
          >
            <RefreshCwIcon className={cn("size-3", loading && "animate-spin")} />
          </Button>
        </div>
        {loading && <p className="py-2 text-center text-xs text-muted-foreground">Loading fonts...</p>}
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((f) => (
            <button
              key={f.postscriptName}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground",
                value === f.family && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                onChange(f.family)
                setOpen(false)
              }}
            >
              <span style={{ fontFamily: f.family }} className="truncate text-sm">
                {f.family}
              </span>
              <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                {f.style}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
