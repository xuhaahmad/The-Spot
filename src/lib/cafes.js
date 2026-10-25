// Loading, validating, searching and filtering café records.
// Pure functions only — no React — so they are easy to test and reuse.

import { ATMOSPHERE_LABELS, FACILITY_LABELS, MOOD_LABELS, PURPOSE_LABELS } from './vocabulary.js'

const FACILITY_KEYS = ['wifi', 'powerOutlets', 'parking', 'airConditioning']
const CONFIDENCE_LEVELS = ['high', 'medium', 'low']

function textOrNull(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

// true / false are facts from a source; anything else means "unknown".
function triState(value) {
  return value === true || value === false ? value : null
}

function knownTags(values, labels) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((value) => typeof value === 'string' && Object.hasOwn(labels, value)))]
}

function normalizeBudget(budget) {
  if (!budget || typeof budget !== 'object') return null
  const { min, max } = budget
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || min > max) return null
  return {
    min,
    max,
    // What the estimate covers. Default is one drink plus one food item.
    includes: budget.includes === 'drink' ? 'drink' : 'drink-and-food',
    basis: textOrNull(budget.basis),
    sourceId: textOrNull(budget.sourceId),
  }
}

function normalizeUrl(value) {
  const text = textOrNull(value)
  if (!text) return null
  try {
    const url = new URL(text)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

/**
 * Turns one raw JSON record into a clean café object with every field present.
 * Returns { cafe } on success or { error } when the record cannot be used.
 */
export function normalizeCafe(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'Record is not an object' }
  const id = textOrNull(raw.id)
  const name = textOrNull(raw.name)
  if (!id) return { error: 'Missing id' }
  if (!name) return { error: `Café "${id}" has no name` }

  const rawFacilities = raw.facilities && typeof raw.facilities === 'object' ? raw.facilities : {}
  const facilities = Object.fromEntries(FACILITY_KEYS.map((key) => [key, triState(rawFacilities[key])]))

  return {
    cafe: {
      id,
      name,
      branch: textOrNull(raw.branch),
      area: textOrNull(raw.area),
      address: textOrNull(raw.address),
      description: textOrNull(raw.description),
      estimatedBudgetPerPerson: normalizeBudget(raw.estimatedBudgetPerPerson),
      moods: knownTags(raw.moods, MOOD_LABELS),
      purposes: knownTags(raw.purposes, PURPOSE_LABELS),
      atmosphere: knownTags(raw.atmosphere, ATMOSPHERE_LABELS),
      facilities,
      outdoorSeating: triState(raw.outdoorSeating),
      noiseLevel: textOrNull(raw.noiseLevel),
      openingHours: textOrNull(raw.openingHours),
      // Optional Google place ID, only if verified and recorded (e.g. "ChIJ…")
      googlePlaceId:
        typeof raw.googlePlaceId === 'string' && /^[A-Za-z0-9_-]{16,}$/.test(raw.googlePlaceId)
          ? raw.googlePlaceId
          : null,
      website: normalizeUrl(raw.website),
      instagram: normalizeUrl(raw.instagram),
      imageUrl: normalizeUrl(raw.imageUrl),
      imageSource: textOrNull(raw.imageSource),
      sourceIds: Array.isArray(raw.sourceIds) ? raw.sourceIds.filter((s) => typeof s === 'string') : [],
      // Which source backs which field, e.g. { address: 'zameen-2019' }
      fieldSources: Object.fromEntries(
        Object.entries(raw.fieldSources && typeof raw.fieldSources === 'object' ? raw.fieldSources : {}).filter(
          ([field, sourceId]) => typeof field === 'string' && typeof sourceId === 'string',
        ),
      ),
      notes: textOrNull(raw.notes),
      lastChecked: textOrNull(raw.lastChecked),
      dataConfidence: CONFIDENCE_LEVELS.includes(raw.dataConfidence) ? raw.dataConfidence : 'low',
    },
  }
}

/**
 * Validates the whole dataset. Bad records are skipped and reported rather
 * than crashing the app. Throws only if the file's overall shape is wrong.
 */
export function loadCafeDataset(json) {
  if (!json || typeof json !== 'object' || !Array.isArray(json.cafes)) {
    throw new Error('Café data is missing or has an unexpected format.')
  }

  const cafes = []
  const skipped = []
  const seenIds = new Set()

  json.cafes.forEach((raw, index) => {
    const { cafe, error } = normalizeCafe(raw)
    if (error) {
      skipped.push({ index, reason: error })
    } else if (seenIds.has(cafe.id)) {
      skipped.push({ index, reason: `Duplicate id "${cafe.id}"` })
    } else {
      seenIds.add(cafe.id)
      cafes.push(cafe)
    }
  })

  return {
    meta: json.meta ?? {},
    sources: json.sources && typeof json.sources === 'object' ? json.sources : {},
    cafes: sortByName(cafes),
    skipped,
  }
}

export function sortByName(cafes) {
  return [...cafes].sort((a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id))
}

// "Café F-6" and "cafe f6" should match each other.
export function compactText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Every word in the query must appear in at least one field,
// so "cafe f7" finds a café named "Café …" in the F-7 area.
export function matchesSearch(cafe, query) {
  const words = String(query ?? '')
    .split(/\s+/)
    .map(compactText)
    .filter(Boolean)
  if (words.length === 0) return true
  const fields = [cafe.name, cafe.branch, cafe.area, cafe.address].map(compactText)
  return words.every((word) => fields.some((field) => field.includes(word)))
}

/** Returns true / false / null (unknown) for a facility key, including outdoor seating. */
export function getFacility(cafe, key) {
  if (key === 'outdoorSeating') return cafe.outdoorSeating
  return cafe.facilities?.[key] ?? null
}

/** Facilities that are confirmed for at least one café — only these are worth filtering by. */
export function getFilterableFacilities(cafes) {
  return Object.keys(FACILITY_LABELS).filter((key) => cafes.some((cafe) => getFacility(cafe, key) === true))
}

export function getAreaOptions(cafes) {
  const areas = new Set(cafes.map((cafe) => cafe.area).filter(Boolean))
  return [...areas].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

/**
 * Applies search and filters. Cafés whose price is unknown are never treated
 * as fitting a budget; they are counted separately so the UI can say so.
 */
export function filterCafes(cafes, { query = '', area = '', maxBudget = null, facilities = [] } = {}) {
  let hiddenUnknownBudget = 0
  let hiddenUnknownFacility = 0

  const results = cafes.filter((cafe) => {
    if (!matchesSearch(cafe, query)) return false
    if (area && cafe.area !== area) return false

    if (maxBudget != null) {
      const budget = cafe.estimatedBudgetPerPerson
      if (!budget) {
        hiddenUnknownBudget += 1
        return false
      }
      if (budget.min > maxBudget) return false
    }

    for (const key of facilities) {
      const value = getFacility(cafe, key)
      if (value !== true) {
        if (value === null) hiddenUnknownFacility += 1
        return false
      }
    }
    return true
  })

  return { results, hiddenUnknownBudget, hiddenUnknownFacility }
}

const pkr = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatPKR(amount) {
  return `Rs ${pkr.format(amount)}`
}

export function formatBudget(budget) {
  if (!budget) return null
  if (budget.min === budget.max) return formatPKR(budget.min)
  return `Rs ${pkr.format(budget.min)}–${pkr.format(budget.max)}`
}

// Google Maps URLs (https://developers.google.com/maps/documentation/urls/get-started)
// need no API key. A Google place ID is only used if one is recorded in the data;
// it is never looked up or guessed.

function placeQuery(cafe, place) {
  return /islamabad/i.test(place) ? `${cafe.name}, ${place}` : `${cafe.name}, ${place}, Islamabad`
}

/**
 * A Google Maps *search* link for the café's name and address. When only the
 * area is known, it searches the area instead (see isAreaOnly in getMapsLinks).
 * Returns null when we don't know enough to identify the place.
 */
export function buildMapsSearchUrl(cafe) {
  const place = cafe.address ?? cafe.area
  if (!cafe.name || !place) return null
  let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery(cafe, place))}`
  if (cafe.googlePlaceId) url += `&query_place_id=${encodeURIComponent(cafe.googlePlaceId)}`
  return url
}

/**
 * Google Maps directions *to* the café. No starting point is set, so Google Maps
 * starts from the user's current location when the device shares it (otherwise
 * it asks for one). Only offered when a street address is recorded, so people
 * are never sent to a guessed location.
 */
export function buildDirectionsUrl(cafe) {
  if (!cafe.name || !cafe.address) return null
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery(cafe, cafe.address))}`
  if (cafe.googlePlaceId) url += `&destination_place_id=${encodeURIComponent(cafe.googlePlaceId)}`
  return url
}

export function getMapsLinks(cafe) {
  return {
    directionsUrl: buildDirectionsUrl(cafe),
    searchUrl: buildMapsSearchUrl(cafe),
    // True when the search uses only the area, because no address is recorded
    isAreaOnly: !cafe.address && Boolean(cafe.area),
  }
}
