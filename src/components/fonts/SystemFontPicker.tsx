import { useCallback, useState } from 'react'
import { RefreshCwIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

interface SystemFontPickerProps {
  value: string
  onChange: (fullName: string, family: string, style: string) => void
}

interface LocalFontData {
  readonly family: string
  readonly fullName: string
  readonly postscriptName: string
  readonly style: string
}

/** Optional browser surface exposed only where Local Font Access is supported. */
type LocalFontAccessWindow = Window & {
  queryLocalFonts?: () => Promise<LocalFontData[]>
}

/** Selects an installed font when the browser grants Local Font Access. */
export function SystemFontPicker({ value, onChange }: SystemFontPickerProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [fonts, setFonts] = useState<LocalFontData[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadFonts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queryLocalFonts = (window as LocalFontAccessWindow).queryLocalFonts
      if (typeof queryLocalFonts !== 'function') {
        setError(t('systemFontsUnavailable'))
        return
      }
      const result = await queryLocalFonts.call(window)
      const unique = new Map<string, LocalFontData>()
      for (const font of result) {
        const key = `${font.family}_${font.style}`
        if (!unique.has(key)) unique.set(key, font)
      }
      setFonts([...unique.values()].sort((left, right) =>
        left.family.localeCompare(right.family)))
    } catch {
      setError(t('systemFontsFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const filtered = search
    ? fonts.filter((font) =>
      font.family.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    : fonts

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) void loadFonts()
        else setError(null)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="h-8 w-full justify-start px-2.5 text-xs font-normal"
          />
        }
      >
        {value || t('chooseSystemFont')}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="mb-1.5 flex items-center gap-1">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-7 pl-7 pr-2 text-xs"
              placeholder={t('searchFonts')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0"
            onClick={() => {
              setFonts([])
              void loadFonts()
            }}
            disabled={loading}
            title={t('refreshSystemFonts')}
          >
            <RefreshCwIcon className={cn('size-3', loading && 'animate-spin')} />
          </Button>
        </div>
        {loading && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {t('loadingFonts')}
          </p>
        )}
        {error && (
          <p role="alert" className="px-1 py-1 text-xs text-destructive">
            {error}
          </p>
        )}
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((font) => (
            <button
              key={font.postscriptName}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground',
                value === font.fullName && 'bg-accent text-accent-foreground',
              )}
              onClick={() => {
                onChange(font.fullName, font.family, font.style)
                setOpen(false)
              }}
            >
              <span style={{ fontFamily: font.family }} className="truncate text-sm">
                {font.fullName}
              </span>
              <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                {font.style}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
