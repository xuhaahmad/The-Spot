// The shape of a user's preferences, plus validation and cleanup.
// This is the contract between the questionnaire (Phase 3) and the
// recommendation engine (Phase 4), so it has no React code in it.

import { ATMOSPHERE_LABELS, FACILITY_LABELS, MOOD_LABELS, PURPOSE_LABELS } from './vocabulary.js'

export const MAX_MOODS = 2

/** Budget per person in PKR. `max: null` means no upper limit. */
export const BUDGET_RANGES = [
  { id: 'under-1000', label: 'Under Rs 1,000', min: 0, max: 1000 },
  { id: '1000-1500', label: 'Rs 1,000–1,500', min: 1000, max: 1500 },
  { id: '1500-2500', label: 'Rs 1,500–2,500', min: 1500, max: 2500 },
  { id: '2500-plus', label: 'Rs 2,500 or more', min: 2500, max: null },
  { id: 'any', label: 'No fixed budget', min: 0, max: null },
]

export const EMPTY_PREFERENCES = Object.freeze({
  purpose: null,
  moods: [],
  budget: null,
  areas: [],
  atmosphere: [],
  facilities: [],
})

export function createPreferences(overrides = {}) {
  return { ...EMPTY_PREFERENCES, moods: [], areas: [], atmosphere: [], facilities: [], ...overrides }
}

export function getBudgetRange(id) {
  return BUDGET_RANGES.find((range) => range.id === id) ?? null
}

/** Order of the questionnaire steps. Only the first three are required. */
export const STEP_IDS = ['purpose', 'moods', 'budget', 'areas', 'extras']
export const REQUIRED_STEPS = ['purpose', 'moods', 'budget']

/** Returns a friendly error message, or null when the step is valid. */
export function validateStep(stepId, prefs) {
  switch (stepId) {
    case 'purpose':
      return prefs.purpose ? null : 'Pick what you’re heading out for to continue.'
    case 'moods':
      if (prefs.moods.length === 0) return 'Pick at least one mood to continue.'
      if (prefs.moods.length > MAX_MOODS) return `Pick up to ${MAX_MOODS} moods.`
      return null
    case 'budget':
      return getBudgetRange(prefs.budget) ? null : 'Pick a budget to continue. “No fixed budget” is fine too.'
    default:
      return null
  }
}

/** Index of the first required step that isn't answered yet, or STEP_IDS.length if all are. */
export function firstIncompleteStep(prefs) {
  const index = STEP_IDS.findIndex((stepId) => validateStep(stepId, prefs) !== null)
  return index === -1 ? STEP_IDS.length : index
}

export function isComplete(prefs) {
  return REQUIRED_STEPS.every((stepId) => validateStep(stepId, prefs) === null)
}

/**
 * Adds or removes a value from a list. When `max` is reached, new values are
 * refused (the list is returned unchanged) rather than silently replacing one.
 */
export function toggleValue(list, value, max = Infinity) {
  if (list.includes(value)) return list.filter((item) => item !== value)
  if (list.length >= max) return list
  return [...list, value]
}

function onlyKnown(values, allowed) {
  if (!Array.isArray(values)) return []
  return [...new Set(values.filter((value) => allowed.includes(value)))]
}

/**
 * Cleans preferences that came from storage or a URL: unknown values are
 * dropped, wrong types are reset. Areas and facilities are checked against
 * what the current dataset actually offers.
 */
export function sanitizePreferences(raw, { areaOptions = [], facilityOptions = Object.keys(FACILITY_LABELS) } = {}) {
  if (!raw || typeof raw !== 'object') return createPreferences()
  return createPreferences({
    // typeof check matters: Object.hasOwn would coerce ['study'] to 'study'
    purpose: typeof raw.purpose === 'string' && Object.hasOwn(PURPOSE_LABELS, raw.purpose) ? raw.purpose : null,
    moods: onlyKnown(raw.moods, Object.keys(MOOD_LABELS)).slice(0, MAX_MOODS),
    budget: getBudgetRange(raw.budget) ? raw.budget : null,
    areas: onlyKnown(raw.areas, areaOptions),
    atmosphere: onlyKnown(raw.atmosphere, Object.keys(ATMOSPHERE_LABELS)),
    facilities: onlyKnown(raw.facilities, facilityOptions),
  })
}

// ---------- Preferences in the URL ----------
// Results live at /results?purpose=…&moods=a,b&budget=…&areas=…&atmosphere=…&facilities=…
// so refreshing, going back, or sharing a link always shows the same search.

const LIST_KEYS = ['moods', 'areas', 'atmosphere', 'facilities']

export function preferencesToSearchParams(prefs) {
  const params = new URLSearchParams()
  if (prefs.purpose) params.set('purpose', prefs.purpose)
  if (prefs.budget) params.set('budget', prefs.budget)
  for (const key of LIST_KEYS) {
    if (prefs[key]?.length) params.set(key, prefs[key].join(','))
  }
  return params
}

/** Reads preferences from URL params. Anything unknown is dropped by sanitizePreferences. */
export function preferencesFromSearchParams(params, options) {
  const raw = { purpose: params.get('purpose'), budget: params.get('budget') }
  for (const key of LIST_KEYS) {
    raw[key] = (params.get(key) ?? '').split(',').filter(Boolean)
  }
  return sanitizePreferences(raw, options)
}

// ---------- Human-readable summary ----------

/** One readable value per questionnaire step, used by the review step and results page. */
export function describePreferences(prefs) {
  const extras = [
    ...prefs.atmosphere.map((value) => ATMOSPHERE_LABELS[value]),
    ...prefs.facilities.map((value) => FACILITY_LABELS[value]),
  ]
  return {
    purpose: PURPOSE_LABELS[prefs.purpose] ?? null,
    moods: prefs.moods.map((mood) => MOOD_LABELS[mood]).join(', ') || null,
    budget: getBudgetRange(prefs.budget)?.label ?? null,
    areas: prefs.areas.length ? prefs.areas.join(', ') : 'Anywhere in Islamabad',
    extras: extras.length ? extras.join(', ') : 'No extra preferences',
  }
}
