import * as React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface WordsInputProps {
  value: string
  onChange: (value: string) => void
}

function WordsInput({ value, onChange }: WordsInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="words-input">Words (one per line)</Label>
      <Textarea
        id="words-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter words, one per line..."
      />
    </div>
  )
}

export { WordsInput }
export type { WordsInputProps }
