// Pure helpers for choosing and remembering the color theme.
// The inline script in index.html mirrors readStoredTheme/resolveTheme
// so the right theme is applied before React loads.

export const THEME_STORAGE_KEY = 'the-spot:theme'

export function isValidTheme(value) {
  return value === 'light' || value === 'dark'
}

// localStorage can throw (private browsing, blocked storage), so never trust it.
export function readStoredTheme(storage) {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY)
    return isValidTheme(value) ? value : null
  } catch {
    return null
  }
}

export function saveTheme(storage, theme) {
  if (!isValidTheme(theme)) return false
  try {
    storage.setItem(THEME_STORAGE_KEY, theme)
    return true
  } catch {
    return false
  }
}

// A saved choice always wins; otherwise follow the operating system.
export function resolveTheme(storedTheme, systemPrefersDark) {
  if (isValidTheme(storedTheme)) return storedTheme
  return systemPrefersDark ? 'dark' : 'light'
}

export function oppositeTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark'
}
