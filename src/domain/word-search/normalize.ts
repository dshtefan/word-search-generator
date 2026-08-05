import type { Language } from './types'

const LOCALES: Readonly<Record<Language, string>> = {
  en: 'en-US',
  ru: 'ru-RU',
  de: 'de-DE',
}

/** Trims, localizes to uppercase, and removes empty word entries without mutating input. */
export function normalizeWords(words: readonly string[], language: Language): string[] {
  return words
    .map((word) => word.trim().toLocaleUpperCase(LOCALES[language]))
    .filter((word) => word.length > 0)
}
