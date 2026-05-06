import type { Language } from '../types'

const EN: Record<string, number> = {
  E: 12, T: 9, A: 8, O: 7.5, I: 7, N: 7, S: 6.3, H: 6, R: 6,
  D: 4.3, L: 4, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2,
  Y: 2, P: 1.9, B: 1.5, V: 0.98, K: 0.77, J: 0.15, X: 0.15,
  Q: 0.095, Z: 0.074,
}

const RU: Record<string, number> = {
  О: 11, Е: 8.5, А: 8, И: 7.4, Н: 6.7, Т: 6.3, С: 5.5, Р: 4.7,
  В: 4.5, Л: 4.3, К: 3.5, М: 3.2, Д: 3, П: 2.8, У: 2.6, Я: 2,
  Ы: 1.9, Ь: 1.7, Г: 1.7, З: 1.6, Б: 1.5, Ч: 1.4, Й: 1.2,
  Х: 1, Ж: 0.94, Ш: 0.72, Ю: 0.64, Ц: 0.48, Щ: 0.36,
  Э: 0.32, Ф: 0.26, Ъ: 0.04,
}

const DE: Record<string, number> = {
  E: 17.4, N: 9.8, I: 7.6, S: 7.3, R: 7.0, A: 6.5, T: 6.2, D: 5.1,
  H: 4.8, U: 4.4, L: 3.4, C: 3.1, G: 3.0, M: 2.5, O: 2.5, B: 1.9,
  W: 1.9, F: 1.7, K: 1.2, Z: 1.1, P: 0.79, V: 0.67, J: 0.27,
  Y: 0.04, X: 0.03, Q: 0.02, Ä: 0.58, Ö: 0.30, Ü: 0.10,
}

export const letterFrequencies: Record<Language, Record<string, number>> = {
  en: EN,
  ru: RU,
  de: DE,
}

type WeightedEntry = { letter: string; threshold: number }

const weightedCache: Partial<Record<Language, WeightedEntry[]>> = {}

function getWeightedEntries(language: Language): WeightedEntry[] {
  if (weightedCache[language]) return weightedCache[language]!

  const freqs = letterFrequencies[language]
  const entries = Object.entries(freqs)
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0)

  const result: WeightedEntry[] = []
  let running = 0

  for (const [letter, weight] of entries) {
    running += weight / totalWeight
    result.push({ letter, threshold: running })
  }

  weightedCache[language] = result
  return result
}

export function getRandomLetter(language: Language): string {
  const list = getWeightedEntries(language)
  const rand = Math.random()

  for (const { letter, threshold } of list) {
    if (rand <= threshold) return letter
  }

  return list[list.length - 1].letter
}
