import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  formatMessage,
  type InterfaceLocale,
  type MessageKey,
  type MessageParams,
} from './messages'
import { I18nContext } from './i18n-context'

const STORAGE_KEY = 'word-search:interface-locale'
const SUPPORTED_LOCALES = new Set<InterfaceLocale>(['en', 'ru', 'de'])

function loadLocale(): InterfaceLocale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return SUPPORTED_LOCALES.has(stored as InterfaceLocale)
      ? stored as InterfaceLocale
      : 'en'
  } catch {
    return 'en'
  }
}

/** Owns interface locale selection independently from word-search settings. */
export function I18nProvider({ children }: { readonly children: ReactNode }) {
  const [locale, setLocaleState] = useState<InterfaceLocale>(loadLocale)
  const setLocale = useCallback((nextLocale: InterfaceLocale) => {
    setLocaleState(nextLocale)
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLocale)
    } catch {
      // Locale persistence is best-effort when browser storage is unavailable.
    }
  }, [])
  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => formatMessage(locale, key, params),
    [locale],
  )

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = formatMessage(locale, 'appTitle')
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
