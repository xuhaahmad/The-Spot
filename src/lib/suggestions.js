// When a search has few or no matches, suggest which preference to relax.
// Each suggestion is tested against the real data first, so we only ever
// suggest a change that actually produces more matches.

import { recommend } from './recommend.js'

const CANDIDATES = [
  {
    id: 'location',
    applies: (prefs) => prefs.areas.length > 0,
    patch: { areas: [] },
    label: 'Search all areas',
  },
  {
    id: 'budget',
    applies: (prefs) => prefs.budget !== 'any',
    patch: { budget: 'any' },
    label: 'Remove the budget limit',
  },
  {
    id: 'atmosphere',
    applies: (prefs) => prefs.atmosphere.length > 0,
    patch: { atmosphere: [] },
    label: 'Drop the atmosphere preferences',
  },
  {
    id: 'facilities',
    applies: (prefs) => prefs.facilities.length > 0,
    patch: { facilities: [] },
    label: 'Drop the facility preferences',
  },
]

export function getRelaxSuggestions(cafes, prefs, options) {
  const currentCount = recommend(cafes, prefs, options).results.length
  return CANDIDATES.filter((candidate) => candidate.applies(prefs))
    .map((candidate) => {
      const relaxed = { ...prefs, ...candidate.patch }
      return {
        id: candidate.id,
        label: candidate.label,
        prefs: relaxed,
        resultCount: recommend(cafes, relaxed, options).results.length,
      }
    })
    .filter((suggestion) => suggestion.resultCount > currentCount)
    .sort((a, b) => b.resultCount - a.resultCount)
}
