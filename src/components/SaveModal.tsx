import { useState } from "react"
import { useWordSearch } from "@/context/WordSearchContext"
import { exportSVG, exportPNG, exportPDF, exportSavedSVG, exportSavedPNG, exportSavedPDF } from "@/lib/export"
import type { ExportOptions } from "@/lib/export"
import type { SavedGeneration } from "@/types"
import JSZip from "jszip"
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
  mode?: "current" | "saved"
  savedList?: SavedGeneration[]
}

type Format = "svg" | "png" | "pdf"

export function SaveModal({ open, onOpenChange, mode = "current", savedList = [] }: SaveModalProps) {
  const { state } = useWordSearch()
  const [format, setFormat] = useState<Format>("svg")
  const [isExporting, setIsExporting] = useState(false)

  const [downloadBoth, setDownloadBoth] = useState(true)
  const [filename, setFilename] = useState("ws")

  async function handleSave() {
    setIsExporting(true)
    try {
      const isSavedMode = mode === "saved"

      if (isSavedMode) {
        const baseOpts: ExportOptions = {}
        if (state.useResolution) baseOpts.resolution = { w: state.resolutionW, h: state.resolutionH }
        if (state.useAspectRatio) baseOpts.aspectRatio = { w: state.aspectRatioW, h: state.aspectRatioH }

        if (savedList.length > 1) {
          const zip = new JSZip()
          for (const gen of savedList) {
            const opts = { ...baseOpts }
            if (gen.useCustomFont) opts.customFontUrl = gen.customFontUrl
            if (gen.useLocalFont) {
              opts.useLocalFont = true
              opts.localFontFamily = gen.localFontFamily
              opts.localFontStyle = gen.localFontStyle
            }
            switch (format) {
              case "svg":
                exportSavedSVG(gen, gen.name, opts, zip)
                break
              case "png":
                await exportSavedPNG(gen, gen.name, opts, zip)
                break
              case "pdf":
                await exportSavedPDF(gen, gen.name, opts, zip)
                break
            }
          }
          const content = await zip.generateAsync({ type: "blob" })
          const url = URL.createObjectURL(content)
          const a = document.createElement("a")
          a.href = url
          a.download = `saved-generations.${format === "svg" ? "zip" : "zip"}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        } else {
          for (const gen of savedList) {
            const opts = { ...baseOpts }
            if (gen.useCustomFont) opts.customFontUrl = gen.customFontUrl
            if (gen.useLocalFont) {
              opts.useLocalFont = true
              opts.localFontFamily = gen.localFontFamily
              opts.localFontStyle = gen.localFontStyle
            }
            switch (format) {
              case "svg":
                exportSavedSVG(gen, gen.name, opts)
                break
              case "png":
                await exportSavedPNG(gen, gen.name, opts)
                break
              case "pdf":
                await exportSavedPDF(gen, gen.name, opts)
                break
            }
          }
        }
        onOpenChange(false)
        return
      }

      const opts: ExportOptions = {}
      opts.filename = filename || "ws"
      opts.highlightColor = state.highlightColor
      opts.fontFamily = state.fontFamily
      if (state.useCustomFont) opts.customFontUrl = state.customFontUrl
      if (state.useLocalFont) {
        opts.useLocalFont = true
        opts.localFontFamily = state.localFontFamily
        opts.localFontStyle = state.localFontStyle
      }
      opts.solutionGrid = state.solutionGrid ?? undefined
      opts.words = state.words
      opts.placements = state.placements
      if (downloadBoth) opts.both = true
      if (state.useResolution) opts.resolution = { w: state.resolutionW, h: state.resolutionH }
      if (state.useAspectRatio) opts.aspectRatio = { w: state.aspectRatioW, h: state.aspectRatioH }

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
      onOpenChange(false)
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
            {mode === "saved" ? `Export ${savedList.length} saved generation${savedList.length !== 1 ? "s" : ""}.` : "Choose a format and download the current word search grid."}
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

          {mode === "current" && (
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
          )}

          {mode === "current" && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 font-normal cursor-pointer">
                <Checkbox
                  checked={downloadBoth}
                  onCheckedChange={setDownloadBoth}
                />
                Download both (with & without answers)
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={(mode === "current" && !state.isGenerated) || (mode === "saved" && savedList.length === 0) || isExporting}>
            {isExporting ? "Saving..." : mode === "saved" ? `Export ${savedList.length} generation${savedList.length !== 1 ? "s" : ""}` : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
