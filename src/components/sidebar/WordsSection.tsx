import { WordsInput } from '@/components/WordsInput'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Language } from '@/domain/word-search'
import { useWordSearch } from '@/store'

const LANGUAGE_OPTIONS: Array<{ value: Language; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'de', label: 'Deutsch' },
]

/** Renders newline-edited words followed by the language card. */
export function WordsSection() {
  const { state, updateGeneration } = useWordSearch()
  const generation = state.settings.generation

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Words</CardTitle>
        </CardHeader>
        <CardContent>
          <WordsInput
            value={generation.words.join('\n')}
            onChange={(value) => updateGeneration({ words: value.split('\n') })}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          <Select
            value={generation.language}
            onValueChange={(value) =>
              updateGeneration({ language: value as Language })}
          >
            <SelectTrigger id="language-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
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
