import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWordSearch } from '@/store'
import { useI18n, type InterfaceLocale } from '@/i18n'

const INTERFACE_LANGUAGES: ReadonlyArray<{
  readonly value: InterfaceLocale
  readonly label: string
}> = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'de', label: 'Deutsch' },
]

const RESOLUTION_PRESETS = [
  { label: '800 × 600', width: 800, height: 600 },
  { label: '1024 × 768', width: 1024, height: 768 },
  { label: '1280 × 1024', width: 1280, height: 1024 },
  { label: '1200 × 1600', width: 1200, height: 1600 },
  { label: '1920 × 1080', width: 1920, height: 1080 },
  { label: '2560 × 1440', width: 2560, height: 1440 },
]
const RATIO_PRESETS = [
  { label: '1:1', width: 1, height: 1 },
  { label: '4:3', width: 4, height: 3 },
  { label: '16:9', width: 16, height: 9 },
  { label: '3:2', width: 3, height: 2 },
  { label: '2:1', width: 2, height: 1 },
  { label: '3:4', width: 3, height: 4 },
  { label: '9:16', width: 9, height: 16 },
  { label: '2:3', width: 2, height: 3 },
  { label: '1:2', width: 1, height: 2 },
]

/** Edits the mutually exclusive preview/output sizing preferences. */
export function PreviewToolbar() {
  const { locale, setLocale, t } = useI18n()
  const { state, updateOutput } = useWordSearch()
  const output = state.settings.output

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-background/60 px-3 py-1.5 text-xs">
      <Label className="flex cursor-pointer items-center gap-1.5 text-xs font-normal">
        <Checkbox
          checked={output.mode === 'resolution'}
          onCheckedChange={(checked) => updateOutput({
            mode: checked ? 'resolution' : 'natural',
          })}
        />
        {t('customResolution')}
      </Label>
      {output.mode === 'resolution' && (
        <>
          <Input
            type="number"
            value={output.resolution.width}
            onChange={(event) => updateOutput({
              resolution: {
                ...output.resolution,
                width: Number(event.target.value),
              },
            })}
            className="h-7 w-16 px-1.5 text-xs"
            min={1}
          />
          <span className="text-muted-foreground">×</span>
          <Input
            type="number"
            value={output.resolution.height}
            onChange={(event) => updateOutput({
              resolution: {
                ...output.resolution,
                height: Number(event.target.value),
              },
            })}
            className="h-7 w-16 px-1.5 text-xs"
            min={1}
          />
          <span className="text-muted-foreground">px</span>
          <Select
            value=""
            onValueChange={(value) => {
              const preset = RESOLUTION_PRESETS.find(({ label }) => label === value)
              if (preset) {
                updateOutput({
                  resolution: { width: preset.width, height: preset.height },
                })
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs" size="sm">
              <SelectValue placeholder={t('preset')} />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_PRESETS.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
      <Label className="flex cursor-pointer items-center gap-1.5 text-xs font-normal">
        <Checkbox
          checked={output.mode === 'aspect-ratio'}
          onCheckedChange={(checked) => updateOutput({
            mode: checked ? 'aspect-ratio' : 'natural',
          })}
        />
        {t('customAspectRatio')}
      </Label>
      {output.mode === 'aspect-ratio' && (
        <>
          <Input
            type="number"
            value={output.aspectRatio.width}
            onChange={(event) => updateOutput({
              aspectRatio: {
                ...output.aspectRatio,
                width: Number(event.target.value),
              },
            })}
            className="h-7 w-14 px-1.5 text-xs"
            min={1}
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            value={output.aspectRatio.height}
            onChange={(event) => updateOutput({
              aspectRatio: {
                ...output.aspectRatio,
                height: Number(event.target.value),
              },
            })}
            className="h-7 w-14 px-1.5 text-xs"
            min={1}
          />
          <Select
            value=""
            onValueChange={(value) => {
              const preset = RATIO_PRESETS.find(({ label }) => label === value)
              if (preset) {
                updateOutput({
                  aspectRatio: { width: preset.width, height: preset.height },
                })
              }
            }}
          >
            <SelectTrigger className="h-7 text-xs" size="sm">
              <SelectValue placeholder={t('preset')} />
            </SelectTrigger>
            <SelectContent>
              {RATIO_PRESETS.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
      <div className="flex-1" />
      <select
        aria-label={t('interfaceLanguage')}
        className="h-7 min-w-28 rounded-lg border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={locale}
        onChange={(event) => setLocale(event.target.value as InterfaceLocale)}
      >
        {INTERFACE_LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => updateOutput({
          mode: 'natural',
          resolution: { width: 1024, height: 768 },
          aspectRatio: { width: 16, height: 9 },
        })}
      >
        {t('resetDefaults')}
      </Button>
    </div>
  )
}
