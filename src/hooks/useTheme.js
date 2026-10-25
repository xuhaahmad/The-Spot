import { useCallback, useEffect, useState } from 'react'
import { oppositeTheme, readStoredTheme, resolveTheme, saveTheme } from '../lib/theme.js'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function getStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function systemPrefersDark() {
  return window.matchMedia?.(DARK_QUERY).matches ?? false
}

function getInitialTheme() {
  // index.html already picked a theme before paint; reuse it to stay in sync.
  const fromDocument = document.documentElement.getAttribute('data-theme')
  if (fromDocument === 'light' || fromDocument === 'dark') return fromDocument
  return resolveTheme(readStoredTheme(getStorage()), systemPrefersDark())
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Follow OS theme changes only while the user hasn't picked one themselves.
  useEffect(() => {
    const media = window.matchMedia?.(DARK_QUERY)
    if (!media) return undefined
    const handleChange = (event) => {
      if (readStoredTheme(getStorage()) === null) {
        setTheme(event.matches ? 'dark' : 'light')
      }
    }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = oppositeTheme(current)
      saveTheme(getStorage(), next)
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
