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

export function useCustomFont(
  useCustomFont: boolean,
  customFontUrl: string,
  onFontFamily: (name: string) => void
) {
  const linkRef = useRef<HTMLLinkElement | null>(null)

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.remove()
      linkRef.current = null
    }

    if (!useCustomFont || !customFontUrl.trim()) return

    const name = extractFontName(customFontUrl)
    if (!name) return

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = customFontUrl
    document.head.appendChild(link)
    linkRef.current = link

    onFontFamily(name)

    return () => {
      if (linkRef.current) {
        linkRef.current.remove()
        linkRef.current = null
      }
    }
  }, [useCustomFont, customFontUrl])
}
