import { describe, expect, it } from 'vitest'
import rawDataset from '../data/cafes.json'
import { buildDirectionsUrl, buildMapsSearchUrl, getMapsLinks, loadCafeDataset, normalizeCafe } from './cafes.js'
import {
  createPreferences,
  describePreferences,
  preferencesFromSearchParams,
  preferencesToSearchParams,
} from './preferences.js'
import { getRelaxSuggestions } from './suggestions.js'

const cafe = (overrides) => normalizeCafe({ id: 'c', name: 'Café', ...overrides }).cafe
const OPTIONS = { areaOptions: ['F-6', 'F-7', 'I-8'], facilityOptions: ['wifi', 'outdoorSeating'] }

describe('preferences in the URL', () => {
  const prefs = createPreferences({
    purpose: 'study',
    moods: ['cozy', 'productive'],
    budget: '1000-1500',
    areas: ['F-7'],
    atmosphere: ['quiet'],
    facilities: ['wifi'],
  })

  it('round-trips through URL params', () => {
    const params = preferencesToSearchParams(prefs)
    expect(params.toString()).toBe(
      'purpose=study&budget=1000-1500&moods=cozy%2Cproductive&areas=F-7&atmosphere=quiet&facilities=wifi',
    )
    expect(preferencesFromSearchParams(params, OPTIONS)).toEqual(prefs)
  })

  it('leaves out empty lists', () => {
    const params = preferencesToSearchParams(createPreferences({ purpose: 'group', moods: ['social'], budget: 'any' }))
    expect([...params.keys()]).toEqual(['purpose', 'budget', 'moods'])
  })

  it('ignores tampered or unknown values', () => {
    const params = new URLSearchParams('purpose=hack&moods=cozy,evil,,&budget=999&areas=Mars&facilities=wifi,teleport')
    expect(preferencesFromSearchParams(params, OPTIONS)).toEqual(
      createPreferences({ moods: ['cozy'], facilities: ['wifi'] }),
    )
  })
})

describe('describePreferences', () => {
  it('gives readable values, with defaults for skipped steps', () => {
    expect(describePreferences(createPreferences({ purpose: 'group', moods: ['social'], budget: 'any' }))).toEqual({
      purpose: 'Reunions & group gatherings',
      moods: 'Social',
      budget: 'No fixed budget',
      areas: 'Anywhere in Islamabad',
      extras: 'No extra preferences',
    })
  })
})

describe('buildMapsSearchUrl', () => {
  it('builds an encoded Google Maps search link from name and address', () => {
    const url = buildMapsSearchUrl(cafe({ name: 'Street 1 Café', address: 'Kohsar Market, F-6/3, Islamabad' }))
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=Street%201%20Caf%C3%A9%2C%20Kohsar%20Market%2C%20F-6%2F3%2C%20Islamabad',
    )
  })

  it('adds the city when the address does not include it', () => {
    expect(decodeURIComponent(buildMapsSearchUrl(cafe({ area: 'F-7' })))).toMatch(/query=Café, F-7, Islamabad$/)
  })

  it('returns null when there is not enough information to identify the place', () => {
    expect(buildMapsSearchUrl(cafe({}))).toBeNull()
  })

  it('encodes characters that could break the URL', () => {
    const url = buildMapsSearchUrl(cafe({ name: 'A&B "Café"', address: 'x?y#z' }))
    const parsed = new URL(url)
    expect(parsed.hash).toBe('')
    expect([...parsed.searchParams.keys()]).toEqual(['api', 'query'])
    expect(parsed.searchParams.get('query')).toBe('A&B "Café", x?y#z, Islamabad')
  })
})

describe('buildDirectionsUrl and getMapsLinks', () => {
  it('builds an encoded directions link with the café as the destination', () => {
    const url = buildDirectionsUrl(cafe({ name: 'Street 1 Café', address: 'Kohsar Market, F-6/3, Islamabad' }))
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Street%201%20Caf%C3%A9%2C%20Kohsar%20Market%2C%20F-6%2F3%2C%20Islamabad',
    )
  })

  it('sets no starting point, so Google Maps can use the device location', () => {
    const parsed = new URL(buildDirectionsUrl(cafe({ address: 'Plot 16A, F-6 Markaz' })))
    expect(parsed.searchParams.has('origin')).toBe(false)
    expect(parsed.searchParams.get('destination')).toBe('Café, Plot 16A, F-6 Markaz, Islamabad')
  })

  it('offers no directions without a recorded address, never a guessed one', () => {
    expect(buildDirectionsUrl(cafe({ area: 'F-7' }))).toBeNull()
    expect(getMapsLinks(cafe({ area: 'F-7' }))).toMatchObject({ directionsUrl: null, isAreaOnly: true })
    expect(getMapsLinks(cafe({}))).toEqual({ directionsUrl: null, searchUrl: null, isAreaOnly: false })
  })

  it('uses a recorded Google place ID, but only a well-formed one', () => {
    const withId = cafe({ address: 'F-6', googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })
    expect(new URL(buildDirectionsUrl(withId)).searchParams.get('destination_place_id')).toBe(
      'ChIJN1t_tDeuEmsRUsoyG83frY4',
    )
    expect(new URL(buildMapsSearchUrl(withId)).searchParams.get('query_place_id')).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4')
    expect(cafe({ googlePlaceId: 'not a place id!' }).googlePlaceId).toBeNull()
  })

  it('works for every café with an address in the real data', () => {
    for (const real of loadCafeDataset(rawDataset).cafes) {
      const { directionsUrl, searchUrl } = getMapsLinks(real)
      expect(searchUrl, real.id).toBeTruthy()
      if (real.address) {
        const parsed = new URL(directionsUrl)
        expect(parsed.origin + parsed.pathname).toBe('https://www.google.com/maps/dir/')
        expect(parsed.searchParams.get('destination')).toContain(real.name)
        expect(parsed.searchParams.get('destination')).toContain(real.address)
      } else {
        expect(directionsUrl, real.id).toBeNull()
      }
    }
  })
})

describe('getRelaxSuggestions', () => {
  const cafes = [
    cafe({ id: 'a', name: 'A', area: 'F-6', purposes: ['study'], moods: ['cozy'], estimatedBudgetPerPerson: { min: 2000, max: 2500 } }),
    cafe({ id: 'b', name: 'B', area: 'I-8', purposes: ['study'], moods: ['cozy'], estimatedBudgetPerPerson: { min: 500, max: 900 } }),
  ]

  it('only suggests changes that produce more matches, best first', () => {
    const prefs = createPreferences({ purpose: 'solo', moods: ['energetic'], budget: 'under-1000', areas: ['F-7'] })
    // Nothing matches a solo, energetic outing; relaxing area/budget does not help, so nothing is suggested.
    expect(getRelaxSuggestions(cafes, prefs)).toEqual([])
  })

  it('suggests searching all areas when the area is what rules cafés out', () => {
    const prefs = createPreferences({ purpose: 'study', moods: ['cozy'], budget: 'under-1000', areas: ['F-7'] })
    const suggestions = getRelaxSuggestions(cafes, prefs, { minScore: 95 })
    expect(suggestions.map((s) => s.id)).toEqual(['location'])
    expect(suggestions[0].prefs.areas).toEqual([])
    expect(suggestions[0].resultCount).toBe(1)
  })

  it('never suggests relaxing something the user did not ask for', () => {
    const prefs = createPreferences({ purpose: 'study', moods: ['cozy'], budget: 'any' })
    expect(getRelaxSuggestions(cafes, prefs)).toEqual([])
  })
})
