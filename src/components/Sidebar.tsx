import { useState } from "react"
import { useWordSearch, clearSavedState } from "@/context/WordSearchContext"
import { WordsInput } from "@/components/WordsInput"
import { GridSizeInputs } from "@/components/GridSizeInputs"
import { MultiSelect } from "@/components/MultiSelect"
import { SaveModal } from "@/components/SaveModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ColorPicker } from "@/components/ui/color-picker"
import { useCustomFont } from "@/hooks/useCustomFont"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Direction, Language, GridStyle } from "@/types"
import { generateGrid } from "@/lib/word-placement"

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
  { value: "de", label: "Deutsch" },
]

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Raleway",
  "Poppins",
  "Nunito",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
] as const

const FONT_SIZE_OPTIONS = [8, 12, 16, 20, 24, 28, 32, 36, 40, 42] as const

const GRID_STYLE_OPTIONS: { value: GridStyle; label: string }[] = [
  { value: "full", label: "Full Grid" },
  { value: "outer", label: "Outer Border Only" },
  { value: "none", label: "No Borders" },
]

const CARDINAL_OPTIONS = [
  { value: "up", label: "↑ Up" },
  { value: "down", label: "↓ Down" },
  { value: "left", label: "← Left" },
  { value: "right", label: "→ Right" },
]

const DIAGONAL_OPTIONS = [
  { value: "up-left", label: "↖ Up-Left" },
  { value: "up-right", label: "↗ Up-Right" },
  { value: "down-left", label: "↙ Down-Left" },
  { value: "down-right", label: "↘ Down-Right" },
]

function Sidebar() {
  const { state, dispatch } = useWordSearch()
  const [saveOpen, setSaveOpen] = useState(false)

  useCustomFont(state.useCustomFont, state.customFontUrl, (name) => {
    dispatch({ type: "SET_FONT_FAMILY", payload: name })
  })

  function handleWordsChange(value: string) {
    const words = value
      .split("\n")
      .map((w) => w.trim())
    dispatch({ type: "SET_WORDS", payload: words })
  }

  function handleCardinalChange(selected: string[]) {
    dispatch({ type: "SET_CARDINAL_DIRECTIONS", payload: selected as Direction[] })
  }

  function handleDiagonalChange(selected: string[]) {
    dispatch({ type: "SET_DIAGONAL_DIRECTIONS", payload: selected as Direction[] })
  }

  function handleGenerate() {
    dispatch({ type: 'SET_IS_GENERATING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })
    const allDirections = [...state.cardinalDirections, ...state.diagonalDirections]
    try {
      const words = state.words.filter(w => w.length > 0)
      const result = generateGrid(words, allDirections, state.gridX, state.gridY, state.language)
      dispatch({ type: 'SET_GRID', payload: result.grid })
      dispatch({ type: 'SET_SOLUTION_GRID', payload: result.solutionGrid })
      dispatch({ type: 'SET_IS_GENERATED', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Unknown error' })
      dispatch({ type: 'SET_GRID', payload: null })
      dispatch({ type: 'SET_SOLUTION_GRID', payload: null })
      dispatch({ type: 'SET_IS_GENERATED', payload: false })
    } finally {
      dispatch({ type: 'SET_IS_GENERATING', payload: false })
    }
  }

  function handleReset() {
    clearSavedState()
    dispatch({ type: 'RESET' })
  }

  return (
    <aside className="flex h-screen w-1/5 shrink-0 flex-col overflow-hidden border-r bg-sidebar p-4">
      <h2 className="text-lg font-semibold">Word Search</h2>
      <Separator className="my-2" />

      <div className="flex-1 overflow-y-auto space-y-4 p-1">
        <Card>
          <CardHeader>
            <CardTitle>Words</CardTitle>
          </CardHeader>
          <CardContent>
            <WordsInput
              value={state.words.join("\n")}
              onChange={handleWordsChange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Select
              value={state.language}
              onValueChange={(value) =>
                dispatch({ type: "SET_LANGUAGE", payload: value as Language })
              }
            >
              <SelectTrigger id="language-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grid Size</CardTitle>
          </CardHeader>
          <CardContent>
            <GridSizeInputs
              gridX={state.gridX}
              gridY={state.gridY}
              onGridXChange={(value) =>
                dispatch({ type: "SET_GRID_X", payload: value })
              }
              onGridYChange={(value) =>
                dispatch({ type: "SET_GRID_Y", payload: value })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highlight Color</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <ColorPicker
              value={state.highlightColor}
              onChange={(value) =>
                dispatch({
                  type: "SET_HIGHLIGHT_COLOR",
                  payload: value,
                })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Cardinal</Label>
              <MultiSelect
                options={CARDINAL_OPTIONS}
                selected={state.cardinalDirections}
                onChange={handleCardinalChange}
                placeholder="Select directions..."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Diagonal</Label>
              <MultiSelect
                options={DIAGONAL_OPTIONS}
                selected={state.diagonalDirections}
                onChange={handleDiagonalChange}
                placeholder="Select directions..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Font</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="font-family">Font</Label>
              {!state.useCustomFont && (
                <Select
                  value={state.fontFamily}
                  onValueChange={(value) =>
                    dispatch({ type: "SET_FONT_FAMILY", payload: value ?? '' })
                  }
                >
                  <SelectTrigger id="font-family" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex flex-col gap-1.5">
                <Label className="flex items-center gap-2 font-normal cursor-pointer">
                  <Checkbox
                    checked={state.useCustomFont}
                    onCheckedChange={(v) =>
                      dispatch({ type: "SET_USE_CUSTOM_FONT", payload: !!v })
                    }
                  />
                  Custom Google Font
                </Label>
                {state.useCustomFont && (
                  <Input
                    type="url"
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    value={state.customFontUrl}
                    onChange={(e) =>
                      dispatch({ type: "SET_CUSTOM_FONT_URL", payload: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="font-size">Font Size</Label>
              <Select
                value={String(state.fontSize)}
                onValueChange={(value) =>
                  dispatch({
                    type: "SET_FONT_SIZE",
                    payload: Number.parseInt(value ?? '', 10),
                  })
                }
              >
                <SelectTrigger id="font-size" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grid Style</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Select
              value={state.gridStyle}
              onValueChange={(value) =>
                dispatch({ type: "SET_GRID_STYLE", payload: value as GridStyle })
              }
            >
              <SelectTrigger id="grid-style" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRID_STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-2" />

      <Card className="shrink-0">
        <CardContent className="flex flex-col gap-2">
          <Button onClick={handleGenerate} disabled={state.isGenerating}>
            {state.isGenerating ? 'Generating...' : 'Generate'}
          </Button>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
          {state.isGenerated && state.words.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {state.words.map((w, i) => (
                <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">{w}</span>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            disabled={!state.isGenerated}
            onClick={() => setSaveOpen(true)}
          >
            Save
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            Reset to defaults
          </Button>
        </CardContent>
      </Card>
      <SaveModal open={saveOpen} onOpenChange={setSaveOpen} />
    </aside>
  )
}

export { Sidebar }
