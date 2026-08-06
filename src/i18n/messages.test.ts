/** @jest-environment node */

import { formatMessage, MESSAGES } from './messages'

describe('interface messages', () => {
  test('keeps every locale dictionary structurally complete', () => {
    const englishKeys = Object.keys(MESSAGES.en).sort()

    expect(Object.keys(MESSAGES.ru).sort()).toEqual(englishKeys)
    expect(Object.keys(MESSAGES.de).sort()).toEqual(englishKeys)
  })

  test('formats dynamic values in every locale', () => {
    expect(formatMessage('en', 'exportSelected', { count: 3 }))
      .toBe('Export selected (3)')
    expect(formatMessage('ru', 'exportSelected', { count: 3 }))
      .toBe('Экспортировать выбранные (3)')
    expect(formatMessage('de', 'exportSelected', { count: 3 }))
      .toBe('Auswahl exportieren (3)')
  })
})
