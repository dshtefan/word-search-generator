import { createContext } from 'react'
import {
  formatMessage,
  type InterfaceLocale,
  type MessageKey,
  type MessageParams,
} from './messages'

/** Locale controls and type-safe translation available to interface components. */
export interface I18nContextValue {
  readonly locale: InterfaceLocale
  readonly setLocale: (locale: InterfaceLocale) => void
  readonly t: (key: MessageKey, params?: MessageParams) => string
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => undefined,
  t: (key, params) => formatMessage('en', key, params),
})
