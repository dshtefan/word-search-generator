import { Textarea } from "@/components/ui/textarea"
import { useI18n } from '@/i18n'

interface WordsInputProps {
  value: string
  onChange: (value: string) => void
}

function WordsInput({ value, onChange }: WordsInputProps) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-1.5">
      <Textarea
        id="words-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('wordsPlaceholder')}
      />
    </div>
  )
}

export { WordsInput }
export type { WordsInputProps }
