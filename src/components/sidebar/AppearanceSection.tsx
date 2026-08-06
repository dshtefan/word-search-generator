import { SystemFontPicker } from '@/components/fonts/SystemFontPicker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import type { GridStyle } from '@/domain/word-search'
import { useCustomFont } from '@/shared/useCustomFont'
import { useWordSearch } from '@/store'
import { useI18n } from '@/i18n'

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Raleway',
  'Poppins',
  'Nunito',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
] as const
const FONT_SIZE_OPTIONS = [
  8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42,
] as const
/** Renders font controls followed by the grid-style card. */
export function AppearanceSection() {
  const { t } = useI18n()
  const { state, updateAppearance } = useWordSearch()
  const appearance = state.settings.appearance
  const gridStyleOptions: Array<{ value: GridStyle; label: string }> = [
    { value: 'full', label: t('gridStyleFull') },
    { value: 'outer', label: t('gridStyleOuter') },
    { value: 'none', label: t('gridStyleNone') },
  ]
  useCustomFont(
    appearance.customFont.enabled,
    appearance.customFont.url,
    (fontFamily) => updateAppearance({ fontFamily }),
  )

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('font')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="font-family">{t('font')}</Label>
            {!appearance.customFont.enabled && !appearance.localFont.enabled && (
              <Select
                value={appearance.fontFamily}
                onValueChange={(fontFamily) =>
                  updateAppearance({ fontFamily: fontFamily ?? '' })}
              >
                <SelectTrigger id="font-family" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font} value={font}>{font}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={appearance.customFont.enabled}
                  onCheckedChange={(enabled) => updateAppearance({
                    customFont: {
                      ...appearance.customFont,
                      enabled: !!enabled,
                    },
                  })}
                />
                {t('customGoogleFont')}
              </Label>
              {appearance.customFont.enabled && (
                <Input
                  type="url"
                  placeholder="https://fonts.googleapis.com/css2?family=..."
                  value={appearance.customFont.url}
                  onChange={(event) => updateAppearance({
                    customFont: {
                      ...appearance.customFont,
                      url: event.target.value,
                    },
                  })}
                  className="h-8 text-xs"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="flex cursor-pointer items-center gap-2 font-normal">
                <Checkbox
                  checked={appearance.localFont.enabled}
                  onCheckedChange={(enabled) => updateAppearance({
                    localFont: {
                      ...appearance.localFont,
                      enabled: !!enabled,
                    },
                  })}
                />
                {t('systemFont')}
              </Label>
              {appearance.localFont.enabled && (
                <SystemFontPicker
                  value={appearance.localFont.fullName || appearance.localFont.family}
                  onChange={(fullName, family, style) => updateAppearance({
                    fontFamily: family,
                    localFont: { enabled: true, fullName, family, style },
                  })}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="font-size">{t('fontSize')}</Label>
            <Select
              value={String(appearance.fontSize)}
              onValueChange={(value) => updateAppearance({
                fontSize: Number.parseInt(value ?? '', 10),
              })}
            >
              <SelectTrigger id="font-size" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('gridStyle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Select
            value={appearance.gridStyle}
            onValueChange={(gridStyle) =>
              updateAppearance({ gridStyle: gridStyle as GridStyle })}
          >
            <SelectTrigger id="grid-style" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gridStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </>
  )
}
