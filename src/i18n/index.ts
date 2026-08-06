import { useContext } from 'react'
import { I18nContext } from './i18n-context'

export { I18nProvider } from './I18nProvider'
export type { InterfaceLocale, MessageKey, MessageParams } from './messages'

/** Returns the current interface locale and its type-safe translator. */
export function useI18n() {
  return useContext(I18nContext)
}
