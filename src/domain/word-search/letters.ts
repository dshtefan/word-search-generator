import type { Language, RandomSource } from './types'

type LetterWeight = readonly [letter: string, weight: number]

const LETTER_WEIGHTS: Readonly<Record<Language, readonly LetterWeight[]>> = {
  en: [
    ['E', 12], ['T', 9], ['A', 8], ['O', 7.5], ['I', 7], ['N', 7],
    ['S', 6.3], ['H', 6], ['R', 6], ['D', 4.3], ['L', 4], ['C', 2.8],
    ['U', 2.8], ['M', 2.4], ['W', 2.4], ['F', 2.2], ['G', 2], ['Y', 2],
    ['P', 1.9], ['B', 1.5], ['V', 0.98], ['K', 0.77], ['J', 0.15],
    ['X', 0.15], ['Q', 0.095], ['Z', 0.074],
  ],
  ru: [
    ['О', 11], ['Е', 8.5], ['А', 8], ['И', 7.4], ['Н', 6.7], ['Т', 6.3],
    ['С', 5.5], ['Р', 4.7], ['В', 4.5], ['Л', 4.3], ['К', 3.5], ['М', 3.2],
    ['Д', 3], ['П', 2.8], ['У', 2.6], ['Я', 2], ['Ы', 1.9], ['Ь', 1.7],
    ['Г', 1.7], ['З', 1.6], ['Б', 1.5], ['Ч', 1.4], ['Й', 1.2], ['Х', 1],
    ['Ж', 0.94], ['Ш', 0.72], ['Ю', 0.64], ['Ц', 0.48], ['Щ', 0.36],
    ['Э', 0.32], ['Ф', 0.26], ['Ъ', 0.04],
  ],
  de: [
    ['E', 17.4], ['N', 9.8], ['I', 7.6], ['S', 7.3], ['R', 7], ['A', 6.5],
    ['T', 6.2], ['D', 5.1], ['H', 4.8], ['U', 4.4], ['L', 3.4], ['C', 3.1],
    ['G', 3], ['M', 2.5], ['O', 2.5], ['B', 1.9], ['W', 1.9], ['F', 1.7],
    ['K', 1.2], ['Z', 1.1], ['P', 0.79], ['V', 0.67], ['J', 0.27],
    ['Y', 0.04], ['X', 0.03], ['Q', 0.02], ['Ä', 0.58], ['Ö', 0.3], ['Ü', 0.1],
  ],
}

function clampRandom(value: number): number {
  if (Number.isNaN(value) || value < 0) return 0
  if (!Number.isFinite(value) || value >= 1) return 1 - Number.EPSILON
  return value
}

/** Selects a frequency-weighted filler letter using the caller-provided random source. */
export function getRandomLetter(language: Language, random: RandomSource): string {
  const weights = LETTER_WEIGHTS[language]
  const totalWeight = weights.reduce((total, [, weight]) => total + weight, 0)
  const target = clampRandom(random()) * totalWeight
  let cumulativeWeight = 0

  for (const [letter, weight] of weights) {
    cumulativeWeight += weight
    if (target < cumulativeWeight) return letter
  }

  return weights[weights.length - 1][0]
}
