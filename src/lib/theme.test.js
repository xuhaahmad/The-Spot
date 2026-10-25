import { describe, expect, it } from 'vitest'
import {
  THEME_STORAGE_KEY,
  isValidTheme,
  oppositeTheme,
  readStoredTheme,
  resolveTheme,
  saveTheme,
} from './theme.js'

// Minimal stand-in for window.localStorage
function createMemoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
    data,
  }
}

const brokenStorage = {
  getItem() {
    throw new Error('SecurityError: storage disabled')
  },
  setItem() {
    throw new Error('QuotaExceededError')
  },
}

describe('isValidTheme', () => {
  it('accepts only light and dark', () => {
    expect(isValidTheme('light')).toBe(true)
    expect(isValidTheme('dark')).toBe(true)
    expect(isValidTheme('blue')).toBe(false)
    expect(isValidTheme(null)).toBe(false)
    expect(isValidTheme(undefined)).toBe(false)
  })
})

describe('resolveTheme', () => {
  it('uses the saved theme when there is one', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('falls back to the system preference on a first visit', () => {
    expect(resolveTheme(null, true)).toBe('dark')
    expect(resolveTheme(null, false)).toBe('light')
  })

  it('ignores invalid saved values', () => {
    expect(resolveTheme('purple', true)).toBe('dark')
  })
})

describe('readStoredTheme', () => {
  it('reads a valid saved theme', () => {
    const storage = createMemoryStorage({ [THEME_STORAGE_KEY]: 'dark' })
    expect(readStoredTheme(storage)).toBe('dark')
  })

  it('returns null for missing or corrupted values', () => {
    expect(readStoredTheme(createMemoryStorage())).toBeNull()
    expect(readStoredTheme(createMemoryStorage({ [THEME_STORAGE_KEY]: '{"oops"' }))).toBeNull()
  })

  it('returns null instead of crashing when storage is unavailable', () => {
    expect(readStoredTheme(brokenStorage)).toBeNull()
    expect(readStoredTheme(null)).toBeNull()
  })
})

describe('saveTheme', () => {
  it('saves a valid theme', () => {
    const storage = createMemoryStorage()
    expect(saveTheme(storage, 'light')).toBe(true)
    expect(storage.data[THEME_STORAGE_KEY]).toBe('light')
  })

  it('refuses invalid themes', () => {
    const storage = createMemoryStorage()
    expect(saveTheme(storage, 'neon')).toBe(false)
    expect(storage.data[THEME_STORAGE_KEY]).toBeUndefined()
  })

  it('reports failure instead of crashing when storage throws', () => {
    expect(saveTheme(brokenStorage, 'dark')).toBe(false)
    expect(saveTheme(null, 'dark')).toBe(false)
  })
})

describe('oppositeTheme', () => {
  it('flips between light and dark', () => {
    expect(oppositeTheme('light')).toBe('dark')
    expect(oppositeTheme('dark')).toBe('light')
  })
})
