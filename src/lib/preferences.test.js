import { describe, expect, it } from 'vitest'
import {
  BUDGET_RANGES,
  MAX_MOODS,
  createPreferences,
  firstIncompleteStep,
  getBudgetRange,
  isComplete,
  sanitizePreferences,
  toggleValue,
  validateStep,
} from './preferences.js'
import { readJSON, writeJSON } from './storage.js'

const complete = createPreferences({ purpose: 'study', moods: ['cozy'], budget: '1000-1500' })

describe('validateStep', () => {
  it('requires a purpose', () => {
    expect(validateStep('purpose', createPreferences())).toMatch(/pick/i)
    expect(validateStep('purpose', complete)).toBeNull()
  })

  it('requires one or two moods', () => {
    expect(validateStep('moods', createPreferences())).toMatch(/at least one/i)
    expect(validateStep('moods', createPreferences({ moods: ['cozy', 'social'] }))).toBeNull()
    expect(validateStep('moods', createPreferences({ moods: ['cozy', 'social', 'relaxed'] }))).toMatch(/up to/i)
  })

  it('requires a known budget option', () => {
    expect(validateStep('budget', createPreferences())).toMatch(/budget/i)
    expect(validateStep('budget', createPreferences({ budget: 'free' }))).toMatch(/budget/i)
    expect(validateStep('budget', createPreferences({ budget: 'any' }))).toBeNull()
  })

  it('never blocks the optional steps', () => {
    expect(validateStep('areas', createPreferences())).toBeNull()
    expect(validateStep('extras', createPreferences())).toBeNull()
  })
})

describe('progress helpers', () => {
  it('finds the first unanswered required step', () => {
    expect(firstIncompleteStep(createPreferences())).toBe(0)
    expect(firstIncompleteStep(createPreferences({ purpose: 'group' }))).toBe(1)
    expect(firstIncompleteStep(complete)).toBe(5)
  })

  it('knows when the required answers are in', () => {
    expect(isComplete(createPreferences())).toBe(false)
    expect(isComplete(complete)).toBe(true)
  })
})

describe('toggleValue', () => {
  it('selects and deselects', () => {
    expect(toggleValue([], 'a')).toEqual(['a'])
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('refuses new values past the limit but still allows removing', () => {
    expect(toggleValue(['a', 'b'], 'c', 2)).toEqual(['a', 'b'])
    expect(toggleValue(['a', 'b'], 'b', 2)).toEqual(['a'])
  })
})

describe('sanitizePreferences', () => {
  const options = { areaOptions: ['F-6', 'F-7'], facilityOptions: ['wifi', 'outdoorSeating'] }

  it('returns empty preferences for junk input', () => {
    expect(sanitizePreferences(null)).toEqual(createPreferences())
    expect(sanitizePreferences('hello')).toEqual(createPreferences())
    expect(sanitizePreferences([1, 2])).toEqual(createPreferences())
  })

  it('keeps valid answers and drops unknown or outdated ones', () => {
    const cleaned = sanitizePreferences(
      {
        purpose: 'study',
        moods: ['cozy', 'cozy', 'haunted', 'social', 'relaxed'],
        budget: '1000-1500',
        areas: ['F-7', 'Lahore'],
        atmosphere: ['quiet', 42],
        facilities: ['wifi', 'parking'],
      },
      options,
    )
    expect(cleaned).toEqual({
      purpose: 'study',
      moods: ['cozy', 'social'],
      budget: '1000-1500',
      areas: ['F-7'],
      atmosphere: ['quiet'],
      facilities: ['wifi'],
    })
    expect(cleaned.moods.length).toBeLessThanOrEqual(MAX_MOODS)
  })

  it('drops the removed "date" purpose and "romantic" mood from old saved answers', () => {
    const cleaned = sanitizePreferences({ purpose: 'date', moods: ['romantic', 'cozy'], budget: 'any' }, options)
    expect(cleaned.purpose).toBeNull()
    expect(cleaned.moods).toEqual(['cozy'])
  })

  it('resets wrong types', () => {
    const cleaned = sanitizePreferences({ purpose: ['study'], moods: 'cozy', budget: 5 }, options)
    expect(cleaned).toEqual(createPreferences())
  })
})

describe('budget ranges', () => {
  it('have unique ids and sensible bounds', () => {
    const ids = BUDGET_RANGES.map((range) => range.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const range of BUDGET_RANGES) {
      if (range.max !== null) expect(range.max).toBeGreaterThan(range.min)
    }
    expect(getBudgetRange('nope')).toBeNull()
  })
})

describe('storage helpers', () => {
  function memoryStore(initial = {}) {
    const data = { ...initial }
    return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v), data }
  }
  const throwingStore = {
    getItem() {
      throw new Error('blocked')
    },
    setItem() {
      throw new Error('blocked')
    },
  }

  it('round-trips JSON', () => {
    const store = memoryStore()
    expect(writeJSON('k', { a: 1 }, { store })).toBe(true)
    expect(readJSON('k', { store })).toEqual({ a: 1 })
  })

  it('returns null for corrupted JSON or missing keys', () => {
    expect(readJSON('k', { store: memoryStore({ k: '{broken' }) })).toBeNull()
    expect(readJSON('missing', { store: memoryStore() })).toBeNull()
  })

  it('fails quietly when storage is blocked or missing', () => {
    expect(readJSON('k', { store: throwingStore })).toBeNull()
    expect(writeJSON('k', 1, { store: throwingStore })).toBe(false)
    expect(writeJSON('k', 1, { store: null })).toBe(false)
  })
})
