import { useState } from "react"
import { useWordSearch } from "@/context/WordSearchContext"
import { exportSVG, exportPNG, exportPDF } from "@/lib/export"
import type { ExportOptions } from "@/lib/export"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Format = "svg" | "png" | "pdf"

const RESOLUTION_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "800 × 600", w: 800, h: 600 },
  { label: "1024 × 768", w: 1024, h: 768 },
  { label: "1280 × 1024", w: 1280, h: 1024 },
  { label: "1920 × 1080", w: 1920, h: 1080 },
  { label: "2560 × 1440", w: 2560, h: 1440 },
]

const RATIO_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "1:1 (Square)", w: 1, h: 1 },
  { label: "4:3 (Landscape)", w: 4, h: 3 },
  { label: "16:9 (Widescreen)", w: 16, h: 9 },
  { label: "3:2 (Photo)", w: 3, h: 2 },
  { label: "2:1 (Panorama)", w: 2, h: 1 },
  { label: "3:4 (Portrait)", w: 3, h: 4 },
  { label: "9:16 (Vertical)", w: 9, h: 16 },
  { label: "2:3 (Photo V)", w: 2, h: 3 },
  { label: "1:2 (Tall)", w: 1, h: 2 },
]

export function SaveModal({ open, onOpenChange }: SaveModalProps) {
  const { state } = useWordSearch()
  const [format, setFormat] = useState<Format>("svg")
  const [isExporting, setIsExporting] = useState(false)

  const [useResolution, setUseResolution] = useState(false)
  const [resW, setResW] = useState(1024)
  const [resH, setResH] = useState(768)

  const [useAspectRatio, setUseAspectRatio] = useState(false)
  const [ratioW, setRatioW] = useState(1)
  const [ratioH, setRatioH] = useState(1)

  const [downloadBoth, setDownloadBoth] = useState(true)
  const [filename, setFilename] = useState("ws")

  async function handleSave() {
    setIsExporting(true)
    try {
      const opts: ExportOptions = {}
      opts.filename = filename || "ws"
      opts.highlightColor = state.highlightColor
      opts.fontFamily = state.fontFamily
      if (state.useCustomFont) opts.customFontUrl = state.customFontUrl
      if (state.useLocalFont) {
        opts.useLocalFont = true
        opts.localFontFamily = state.localFontFamily
      }
      opts.solutionGrid = state.solutionGrid ?? undefined
      if (downloadBoth) opts.both = true
      if (useResolution) opts.resolution = { w: resW, h: resH }
      if (useAspectRatio) opts.aspectRatio = { w: ratioW, h: ratioH }

      switch (format) {
        case "svg":
          await exportSVG(opts)
          break
        case "png":
          await exportPNG(opts)
          break
        case "pdf":
          await exportPDF(opts)
          break
      }
    } catch (err) {
      console.error("Export failed:", err)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save Word Search</DialogTitle>
          <DialogDescription>
            Choose a format and download the current word search grid.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="format-select">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filename-input">File name</Label>
            <Input
              id="filename-input"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="ws"
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2 font-normal cursor-pointer">
              <Checkbox
                checked={useResolution}
                onCheckedChange={setUseResolution}
              />
              Custom resolution
            </Label>
            {useResolution && (
              <div className="flex flex-col gap-1.5 pl-6">
                <Select
                  value=""
                  onValueChange={(v) => {
                    const p = RESOLUTION_PRESETS.find((r) => r.label === v)
                    if (p) { setResW(p.w); setResH(p.h) }
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTION_PRESETS.map((r) => (
                      <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={resW}
                    onChange={(e) => setResW(Number(e.target.value) || 1)}
                    className="h-7 w-20 px-2 text-xs"
                    min={1}
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input
                    type="number"
                    value={resH}
                    onChange={(e) => setResH(Number(e.target.value) || 1)}
                    className="h-7 w-20 px-2 text-xs"
                    min={1}
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2 font-normal cursor-pointer">
              <Checkbox
                checked={useAspectRatio}
                onCheckedChange={setUseAspectRatio}
              />
              Custom aspect ratio
            </Label>
            {useAspectRatio && (
              <div className="flex flex-col gap-1.5 pl-6">
                <Select
                  value=""
                  onValueChange={(v) => {
                    const p = RATIO_PRESETS.find((r) => r.label === v)
                    if (p) { setRatioW(p.w); setRatioH(p.h) }
                  }}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RATIO_PRESETS.map((r) => (
                      <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={ratioW}
                    onChange={(e) => setRatioW(Number(e.target.value) || 1)}
                    className="h-7 w-16 px-2 text-xs"
                    min={1}
                  />
                  <span className="text-xs text-muted-foreground">:</span>
                  <Input
                    type="number"
                    value={ratioH}
                    onChange={(e) => setRatioH(Number(e.target.value) || 1)}
                    className="h-7 w-16 px-2 text-xs"
                    min={1}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2 font-normal cursor-pointer">
              <Checkbox
                checked={downloadBoth}
                onCheckedChange={setDownloadBoth}
              />
              Download both (with & without answers)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!state.isGenerated || isExporting}>
            {isExporting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
