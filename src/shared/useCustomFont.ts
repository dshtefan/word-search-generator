import { useEffect, useRef } from 'react'

function extractFontName(url: string): string | null {
  try {
    const parsed = new URL(url)
    const family = parsed.searchParams.get('family')
    if (!family) return null
    return family.split(':')[0].replace(/\+/g, ' ')
  } catch {
    return null
  }
}

/** Loads one configured web-font stylesheet and reports its parsed family name. */
export function useCustomFont(
  enabled: boolean,
  url: string,
  onFontFamily: (name: string) => void,
) {
  const linkRef = useRef<HTMLLinkElement | null>(null)
  const callbackRef = useRef(onFontFamily)

  useEffect(() => {
    callbackRef.current = onFontFamily
  }, [onFontFamily])

  useEffect(() => {
    linkRef.current?.remove()
    linkRef.current = null

    if (!enabled || !url.trim()) return

    const name = extractFontName(url)
    if (!name) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
    linkRef.current = link
    callbackRef.current(name)

    return () => {
      link.remove()
      if (linkRef.current === link) linkRef.current = null
    }
  }, [enabled, url])
}
