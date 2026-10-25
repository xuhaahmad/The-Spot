import { describe, expect, it } from 'vitest'
import rawDataset from '../data/cafes.json'
import {
  compactText,
  filterCafes,
  formatBudget,
  getAreaOptions,
  getFilterableFacilities,
  loadCafeDataset,
  matchesSearch,
  normalizeCafe,
} from './cafes.js'
import { ATMOSPHERE_LABELS, MOOD_LABELS, PURPOSE_LABELS } from './vocabulary.js'

function makeCafe(overrides = {}) {
  return normalizeCafe({ id: 'test', name: 'Test Café', ...overrides }).cafe
}

describe('normalizeCafe', () => {
  it('fills every optional field with a safe "unknown" value', () => {
    const cafe = makeCafe()
    expect(cafe.area).toBeNull()
    expect(cafe.address).toBeNull()
    expect(cafe.estimatedBudgetPerPerson).toBeNull()
    expect(cafe.moods).toEqual([])
    expect(cafe.facilities).toEqual({ wifi: null, powerOutlets: null, parking: null, airConditioning: null })
    expect(cafe.outdoorSeating).toBeNull()
    expect(cafe.dataConfidence).toBe('low')
  })

  it('rejects records without an id or name', () => {
    expect(normalizeCafe({ name: 'No id' }).error).toBeTruthy()
    expect(normalizeCafe({ id: 'no-name' }).error).toBeTruthy()
    expect(normalizeCafe(null).error).toBeTruthy()
  })

  it('treats anything other than true/false as unknown for facilities', () => {
    const cafe = makeCafe({ facilities: { wifi: 'yes', parking: false }, outdoorSeating: 1 })
    expect(cafe.facilities.wifi).toBeNull()
    expect(cafe.facilities.parking).toBe(false)
    expect(cafe.outdoorSeating).toBeNull()
  })

  it('drops invalid budgets', () => {
    expect(makeCafe({ estimatedBudgetPerPerson: { min: 2000, max: 1000 } }).estimatedBudgetPerPerson).toBeNull()
    expect(makeCafe({ estimatedBudgetPerPerson: { min: '500', max: 900 } }).estimatedBudgetPerPerson).toBeNull()
    expect(makeCafe({ estimatedBudgetPerPerson: { min: 500, max: 900 } }).estimatedBudgetPerPerson).toMatchObject({
      min: 500,
      max: 900,
      includes: 'drink-and-food',
    })
    expect(
      makeCafe({ estimatedBudgetPerPerson: { min: 500, max: 900, includes: 'drink' } }).estimatedBudgetPerPerson
        .includes,
    ).toBe('drink')
  })

  it('ignores the removed "date" purpose and "romantic" mood if old data still has them', () => {
    const cafe = makeCafe({ purposes: ['date', 'friends'], moods: ['romantic'] })
    expect(cafe.purposes).toEqual(['friends'])
    expect(cafe.moods).toEqual([])
  })

  it('ignores unknown tag values and duplicates', () => {
    const cafe = makeCafe({ moods: ['cozy', 'cozy', 'spooky'], purposes: 'work' })
    expect(cafe.moods).toEqual(['cozy'])
    expect(cafe.purposes).toEqual([])
  })

  it('only keeps http(s) links', () => {
    expect(makeCafe({ website: 'javascript:alert(1)' }).website).toBeNull()
    expect(makeCafe({ website: 'not a url' }).website).toBeNull()
    expect(makeCafe({ website: 'https://example.com' }).website).toBe('https://example.com/')
  })
})

describe('loadCafeDataset', () => {
  it('throws a clear error when the file shape is wrong', () => {
    expect(() => loadCafeDataset(null)).toThrow()
    expect(() => loadCafeDataset({ cafes: 'nope' })).toThrow()
  })

  it('skips bad and duplicate records instead of crashing', () => {
    const { cafes, skipped } = loadCafeDataset({
      cafes: [{ id: 'a', name: 'A' }, { id: 'a', name: 'A again' }, { name: 'No id' }, 42],
    })
    expect(cafes.map((c) => c.id)).toEqual(['a'])
    expect(skipped).toHaveLength(3)
  })

  it('sorts cafés by name', () => {
    const { cafes } = loadCafeDataset({ cafes: [{ id: 'b', name: 'Zest' }, { id: 'a', name: 'Aroma' }] })
    expect(cafes.map((c) => c.name)).toEqual(['Aroma', 'Zest'])
  })
})

describe('search', () => {
  const cafe = makeCafe({ name: 'Café Aylanto', area: 'F-7', address: 'Jinnah Avenue, Blue Area' })

  it('ignores case, accents, spaces and hyphens', () => {
    expect(compactText('Café F-7')).toBe('cafef7')
    expect(matchesSearch(cafe, 'cafe aylanto')).toBe(true)
    expect(matchesSearch(cafe, 'f7')).toBe(true)
    expect(matchesSearch(cafe, 'blue area')).toBe(true)
  })

  it('lets each word match a different field', () => {
    expect(matchesSearch(cafe, 'cafe f7')).toBe(true)
    expect(matchesSearch(cafe, 'cafe f8')).toBe(false)
  })

  it('matches everything for an empty query and nothing for an unrelated one', () => {
    expect(matchesSearch(cafe, '   ')).toBe(true)
    expect(matchesSearch(cafe, 'karachi')).toBe(false)
  })
})

describe('filterCafes', () => {
  const cafes = [
    makeCafe({ id: 'cheap', name: 'Cheap', area: 'F-6', estimatedBudgetPerPerson: { min: 600, max: 900 } }),
    makeCafe({ id: 'pricey', name: 'Pricey', area: 'F-7', estimatedBudgetPerPerson: { min: 1800, max: 2500 } }),
    makeCafe({ id: 'unknown', name: 'Unknown', area: 'F-6', outdoorSeating: true }),
    makeCafe({ id: 'wifi', name: 'Wifi', area: 'F-8', facilities: { wifi: true } }),
  ]

  it('returns everything with no filters', () => {
    expect(filterCafes(cafes).results).toHaveLength(4)
  })

  it('filters by area', () => {
    expect(filterCafes(cafes, { area: 'F-6' }).results.map((c) => c.id)).toEqual(['cheap', 'unknown'])
  })

  it('never counts an unknown price as fitting a budget, but reports how many were hidden', () => {
    const { results, hiddenUnknownBudget } = filterCafes(cafes, { maxBudget: 1000 })
    expect(results.map((c) => c.id)).toEqual(['cheap'])
    expect(hiddenUnknownBudget).toBe(2)
  })

  it('keeps cafés whose estimate starts within the budget', () => {
    expect(filterCafes(cafes, { maxBudget: 2000 }).results.map((c) => c.id)).toEqual(['cheap', 'pricey'])
  })

  it('requires confirmed facilities and never treats unknown as yes', () => {
    const { results, hiddenUnknownFacility } = filterCafes(cafes, { facilities: ['outdoorSeating'] })
    expect(results.map((c) => c.id)).toEqual(['unknown'])
    expect(hiddenUnknownFacility).toBe(3)
  })

  it('combines search and filters', () => {
    expect(filterCafes(cafes, { query: 'wifi', area: 'F-6' }).results).toEqual([])
  })
})

describe('helpers', () => {
  it('formats budgets in PKR', () => {
    expect(formatBudget({ min: 900, max: 1450 })).toBe('Rs 900–1,450')
    expect(formatBudget({ min: 1000, max: 1000 })).toBe('Rs 1,000')
    expect(formatBudget(null)).toBeNull()
  })

  it('lists areas in a natural order without blanks', () => {
    const cafes = [makeCafe({ area: 'F-11' }), makeCafe({ area: 'F-6' }), makeCafe({ area: null })]
    expect(getAreaOptions(cafes)).toEqual(['F-6', 'F-11'])
  })

  it('only offers facility filters that at least one café confirms', () => {
    expect(getFilterableFacilities([makeCafe({ facilities: { wifi: true } })])).toEqual(['wifi'])
    expect(getFilterableFacilities([makeCafe()])).toEqual([])
  })
})

// Guards the real dataset against accidental mistakes when it is edited.
describe('src/data/cafes.json integrity', () => {
  const dataset = loadCafeDataset(rawDataset)

  it('loads every record without skipping any', () => {
    expect(dataset.skipped).toEqual([])
    expect(dataset.cafes.length).toBe(rawDataset.cafes.length)
  })

  it('only references sources that exist', () => {
    for (const raw of rawDataset.cafes) {
      const referenced = [
        ...raw.sourceIds,
        ...Object.values(raw.fieldSources ?? {}),
        raw.estimatedBudgetPerPerson?.sourceId,
      ].filter(Boolean)
      for (const id of referenced) {
        expect(rawDataset.sources, `${raw.id} → ${id}`).toHaveProperty(id)
      }
    }
  })

  it('cites a source for every confirmed facility and every price estimate', () => {
    for (const raw of rawDataset.cafes) {
      const fieldSources = raw.fieldSources ?? {}
      for (const [key, value] of Object.entries(raw.facilities ?? {})) {
        if (value !== null) expect(fieldSources, `${raw.id} facilities.${key}`).toHaveProperty(`facilities.${key}`)
      }
      if (raw.outdoorSeating !== null) expect(fieldSources, `${raw.id} outdoorSeating`).toHaveProperty('outdoorSeating')
      if (raw.estimatedBudgetPerPerson) {
        expect(raw.estimatedBudgetPerPerson.sourceId, raw.id).toBeTruthy()
        expect(raw.estimatedBudgetPerPerson.basis, raw.id).toBeTruthy()
      }
    }
  })

  it('only uses tag values the app knows (nothing silently ignored)', () => {
    const vocabularies = { moods: MOOD_LABELS, purposes: PURPOSE_LABELS, atmosphere: ATMOSPHERE_LABELS }
    for (const raw of rawDataset.cafes) {
      for (const [field, labels] of Object.entries(vocabularies)) {
        for (const value of raw[field]) expect(Object.keys(labels), `${raw.id} ${field}`).toContain(value)
      }
    }
  })

  it('does not include ratings, review counts or popularity numbers', () => {
    for (const raw of rawDataset.cafes) {
      for (const banned of ['rating', 'ratings', 'reviews', 'reviewCount', 'popularity']) {
        expect(raw, raw.id).not.toHaveProperty(banned)
      }
    }
  })
})
