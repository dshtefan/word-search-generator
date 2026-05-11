import { useWordSearch } from "@/context/WordSearchContext"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const RESOLUTION_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "800 × 600", w: 800, h: 600 },
  { label: "1024 × 768", w: 1024, h: 768 },
  { label: "1280 × 1024", w: 1280, h: 1024 },
  { label: "1920 × 1080", w: 1920, h: 1080 },
  { label: "2560 × 1440", w: 2560, h: 1440 },
]

const RATIO_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "1:1", w: 1, h: 1 },
  { label: "4:3", w: 4, h: 3 },
  { label: "16:9", w: 16, h: 9 },
  { label: "3:2", w: 3, h: 2 },
  { label: "2:1", w: 2, h: 1 },
  { label: "3:4", w: 3, h: 4 },
  { label: "9:16", w: 9, h: 16 },
  { label: "2:3", w: 2, h: 3 },
  { label: "1:2", w: 1, h: 2 },
]

export function PreviewToolbar() {
  const { state, dispatch } = useWordSearch()

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 border-b bg-background/60 text-xs">
      <Label className="flex items-center gap-1.5 font-normal cursor-pointer text-xs">
        <Checkbox
          checked={state.useResolution}
          onCheckedChange={(v) => {
            if (typeof v === "boolean") {
              dispatch({ type: "SET_USE_RESOLUTION", payload: v })
            }
          }}
        />
        Custom resolution
      </Label>
      {state.useResolution && (
        <>
          <Input
            type="number"
            value={state.resolutionW}
            onChange={(e) => dispatch({ type: "SET_RESOLUTION_W", payload: Number(e.target.value) || 1 })}
            className="h-7 w-16 px-1.5 text-xs"
            min={1}
          />
          <span className="text-muted-foreground">×</span>
          <Input
            type="number"
            value={state.resolutionH}
            onChange={(e) => dispatch({ type: "SET_RESOLUTION_H", payload: Number(e.target.value) || 1 })}
            className="h-7 w-16 px-1.5 text-xs"
            min={1}
          />
          <span className="text-muted-foreground">px</span>
          <Select
            value=""
            onValueChange={(v) => {
              if (!v) return
              const p = RESOLUTION_PRESETS.find((r) => r.label === v)
              if (p) {
                dispatch({ type: "SET_RESOLUTION_W", payload: p.w })
                dispatch({ type: "SET_RESOLUTION_H", payload: p.h })
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs" size="sm">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_PRESETS.map((r) => (
                <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      <Label className="flex items-center gap-1.5 font-normal cursor-pointer text-xs">
        <Checkbox
          checked={state.useAspectRatio}
          onCheckedChange={(v) => {
            if (typeof v === "boolean") {
              dispatch({ type: "SET_USE_ASPECT_RATIO", payload: v })
            }
          }}
        />
        Custom aspect ratio
      </Label>
      {state.useAspectRatio && (
        <>
          <Input
            type="number"
            value={state.aspectRatioW}
            onChange={(e) => dispatch({ type: "SET_ASPECT_RATIO_W", payload: Number(e.target.value) || 1 })}
            className="h-7 w-14 px-1.5 text-xs"
            min={1}
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            value={state.aspectRatioH}
            onChange={(e) => dispatch({ type: "SET_ASPECT_RATIO_H", payload: Number(e.target.value) || 1 })}
            className="h-7 w-14 px-1.5 text-xs"
            min={1}
          />
          <Select
            value=""
            onValueChange={(v) => {
              if (!v) return
              const p = RATIO_PRESETS.find((r) => r.label === v)
              if (p) {
                dispatch({ type: "SET_ASPECT_RATIO_W", payload: p.w })
                dispatch({ type: "SET_ASPECT_RATIO_H", payload: p.h })
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs" size="sm">
              <SelectValue placeholder="Preset" />
            </SelectTrigger>
            <SelectContent>
              {RATIO_PRESETS.map((r) => (
                <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => {
          dispatch({ type: "SET_USE_RESOLUTION", payload: false })
          dispatch({ type: "SET_RESOLUTION_W", payload: 1024 })
          dispatch({ type: "SET_RESOLUTION_H", payload: 768 })
          dispatch({ type: "SET_USE_ASPECT_RATIO", payload: false })
          dispatch({ type: "SET_ASPECT_RATIO_W", payload: 16 })
          dispatch({ type: "SET_ASPECT_RATIO_H", payload: 9 })
        }}
      >
        Reset defaults
      </Button>
    </div>
  )
}
