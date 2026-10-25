// The Spot recommendation engine.
//
// A deterministic, transparent scoring model — no AI, no randomness.
// See docs/ALGORITHM.md for the full explanation in plain English.
//
// Every criterion produces a fraction from 0 to 1 and a status:
//   match       – the café's data agrees with the preference      (full credit)
//   partial     – it agrees in part                                (some credit)
//   mismatch    – the data disagrees                               (0)
//   unknown     – the user asked, but we have no data              (0, still counted)
//   not-asked   – the user skipped this preference                 (left out entirely)
//
// score = 100 × (sum of weight × fraction) ÷ (sum of weights that were asked)

import { formatBudget, formatPKR, getFacility } from './cafes.js'
import { getBudgetRange } from './preferences.js'
import {
  ATMOSPHERE_LABELS,
  FACILITY_PHRASES,
  MOOD_LABELS,
  PURPOSE_PHRASES,
} from './vocabulary.js'

export const WEIGHTS = Object.freeze({
  purpose: 25,
  budget: 25,
  mood: 20,
  atmosphere: 15,
  location: 10,
  facilities: 5,
})

export const PARTIAL_CREDIT = 0.5
export const BUDGET_OVERLAP_CREDIT = 0.6

// Closely related tags earn partial credit, e.g. a café tagged for working
// is a reasonable (not perfect) suggestion for studying, and one tagged for
// catching up with friends is a reasonable suggestion for a group reunion.
const RELATED = {
  purpose: {
    study: ['work'],
    work: ['study'],
    friends: ['casual-meetup', 'group'],
    'casual-meetup': ['friends', 'group'],
    group: ['friends', 'casual-meetup'],
  },
  atmosphere: { quiet: ['calm'], calm: ['quiet'] },
}

export const MATCH_LABELS = [
  { min: 75, label: 'Strong match' },
  { min: 50, label: 'Good match' },
  { min: 25, label: 'Partial match' },
  { min: 0, label: 'Weak match' },
]

export const DEFAULT_MIN_SCORE = 25

const lower = (text) => text.charAt(0).toLowerCase() + text.slice(1)

function listText(items) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

function result(status, fraction, reason, short = null) {
  return { status, fraction, reason, short }
}

// ---------- Individual criteria ----------

function scorePurpose(cafe, purpose) {
  if (!purpose) return result('not-asked', 0, null)
  const wanted = PURPOSE_PHRASES[purpose]
  if (cafe.purposes.length === 0) return result('unknown', 0, `Not enough information to say if it suits ${wanted}.`)
  if (cafe.purposes.includes(purpose)) {
    return result('match', 1, `Tagged as good for ${wanted}.`, `tagged for ${wanted}`)
  }
  const related = cafe.purposes.find((p) => RELATED.purpose[purpose]?.includes(p))
  if (related) {
    return result(
      'partial',
      PARTIAL_CREDIT,
      `Tagged for ${PURPOSE_PHRASES[related]}, which can also suit ${wanted}.`,
      `tagged for ${PURPOSE_PHRASES[related]}`,
    )
  }
  const tagged = cafe.purposes.map((p) => PURPOSE_PHRASES[p])
  return result('mismatch', 0, `Tagged for ${listText(tagged)} rather than ${wanted}.`)
}

function scoreMood(cafe, moods) {
  if (!moods?.length) return result('not-asked', 0, null)
  const wanted = moods.map((m) => lower(MOOD_LABELS[m]))
  if (cafe.moods.length === 0) return result('unknown', 0, 'Its mood isn’t described in our sources.')
  const matched = moods.filter((m) => cafe.moods.includes(m))
  if (matched.length === 0) return result('mismatch', 0, `Not tagged as ${listText(wanted)}.`)
  const matchedText = listText(matched.map((m) => lower(MOOD_LABELS[m])))
  if (matched.length === moods.length) {
    return result('match', 1, `Matches your ${matchedText} mood.`, `matches your ${matchedText} mood`)
  }
  const missed = moods.filter((m) => !matched.includes(m)).map((m) => lower(MOOD_LABELS[m]))
  return result(
    'partial',
    matched.length / moods.length,
    `Matches your ${matchedText} mood, but isn’t tagged as ${listText(missed)}.`,
    `matches your ${matchedText} mood`,
  )
}

function scoreBudget(cafe, budgetId) {
  const range = getBudgetRange(budgetId)
  if (!range || (range.min === 0 && range.max === null)) return result('not-asked', 0, null)

  const estimate = cafe.estimatedBudgetPerPerson
  if (!estimate) return result('unknown', 0, 'Price unknown, so we can’t check it against your budget.')

  const perWhat = estimate.includes === 'drink' ? 'for one drink' : 'per person'
  const estimateText = `${formatBudget(estimate)} ${perWhat}`
  const userMax = range.max ?? Infinity
  const limitText = range.max ? `your budget of up to ${formatPKR(range.max)}` : 'your budget'

  if (estimate.min > userMax) {
    return result('mismatch', 0, `Estimated from ${formatPKR(estimate.min)} ${perWhat}, above ${limitText}.`)
  }
  // Affordability is what matters: the whole estimate must fit under the maximum.
  // Spending less than the user's range is never penalised.
  if (estimate.max <= userMax) {
    if (estimate.max < range.min) {
      return result('match', 1, `Estimated ${estimateText}, less than the ${range.label} you picked.`, 'under your budget')
    }
    return result('match', 1, `Estimated ${estimateText}, within ${limitText}.`, 'fits your budget')
  }
  return result(
    'partial',
    BUDGET_OVERLAP_CREDIT,
    `Estimated ${estimateText}, so some options fit ${limitText} and some don’t.`,
    'some options within budget',
  )
}

function scoreLocation(cafe, areas) {
  if (!areas?.length) return result('not-asked', 0, null)
  if (!cafe.area) return result('unknown', 0, 'Area unknown.')
  if (areas.includes(cafe.area)) return result('match', 1, `In ${cafe.area}, one of your chosen areas.`, `in ${cafe.area}`)
  return result('mismatch', 0, `In ${cafe.area}, outside your chosen areas.`)
}

function scoreAtmosphere(cafe, wantedList) {
  if (!wantedList?.length) return result('not-asked', 0, null)
  if (cafe.atmosphere.length === 0) return result('unknown', 0, 'Its atmosphere isn’t described in our sources.')

  let credit = 0
  const found = [] // atmosphere names the café actually has
  const details = [] // same, with a note when it's only a related match
  for (const wanted of wantedList) {
    const wantedName = lower(ATMOSPHERE_LABELS[wanted])
    if (cafe.atmosphere.includes(wanted)) {
      credit += 1
      found.push(wantedName)
      details.push(wantedName)
    } else {
      const near = cafe.atmosphere.find((a) => RELATED.atmosphere[wanted]?.includes(a))
      if (near) {
        const nearName = lower(ATMOSPHERE_LABELS[near])
        credit += PARTIAL_CREDIT
        found.push(nearName)
        details.push(`${nearName} (you asked for ${wantedName})`)
      }
    }
  }
  const fraction = credit / wantedList.length
  if (fraction === 0) {
    return result('mismatch', 0, `Not tagged as ${listText(wantedList.map((a) => lower(ATMOSPHERE_LABELS[a])))}.`)
  }
  return result(
    fraction === 1 ? 'match' : 'partial',
    fraction,
    `Atmosphere tagged as ${listText(details)}.`,
    `${listText(found)} atmosphere`,
  )
}

function scoreFacilities(cafe, wantedList) {
  if (!wantedList?.length) return result('not-asked', 0, null)
  const confirmed = []
  const missing = []
  const unknown = []
  for (const key of wantedList) {
    const value = getFacility(cafe, key)
    const label = FACILITY_PHRASES[key]
    if (value === true) confirmed.push(label)
    else if (value === false) missing.push(label)
    else unknown.push(label)
  }
  const fraction = confirmed.length / wantedList.length
  const parts = []
  if (confirmed.length) parts.push(`${listText(confirmed)} mentioned in our sources`)
  if (missing.length) parts.push(`no ${listText(missing)} according to our sources`)
  if (unknown.length) parts.push(`${listText(unknown)} not confirmed`)
  const reason = `${parts.join('; ').replace(/^./, (c) => c.toUpperCase())}.`

  let status
  if (fraction === 1) status = 'match'
  else if (fraction > 0) status = 'partial'
  else if (missing.length > 0) status = 'mismatch'
  else status = 'unknown'

  return result(status, fraction, reason, confirmed.length ? `${listText(confirmed)} mentioned in sources` : null)
}

// ---------- Scoring and ranking ----------

function labelFor(score) {
  return MATCH_LABELS.find((entry) => score >= entry.min).label
}

function buildSummary(label, prefs, criteria) {
  const lead = prefs.purpose ? `${label} for ${PURPOSE_PHRASES[prefs.purpose]}` : label
  const positives = criteria
    .filter((c) => (c.status === 'match' || c.status === 'partial') && c.short)
    .map((c) => c.short)
  if (positives.length === 0) return `${lead}: few of your preferences could be confirmed for this café.`
  return `${lead}: ${listText(positives)}.`
}

/**
 * Scores one café against the user's preferences. Pure: same input, same output.
 * Returns the score (0–100), a label, a data-coverage figure and a reason per criterion.
 */
export function scoreCafe(cafe, prefs) {
  const raw = {
    purpose: scorePurpose(cafe, prefs.purpose),
    budget: scoreBudget(cafe, prefs.budget),
    mood: scoreMood(cafe, prefs.moods),
    atmosphere: scoreAtmosphere(cafe, prefs.atmosphere),
    location: scoreLocation(cafe, prefs.areas),
    facilities: scoreFacilities(cafe, prefs.facilities),
  }

  const criteria = Object.entries(raw).map(([id, outcome]) => ({ id, weight: WEIGHTS[id], ...outcome }))
  const asked = criteria.filter((c) => c.status !== 'not-asked')
  const possible = asked.reduce((sum, c) => sum + c.weight, 0)
  const earned = asked.reduce((sum, c) => sum + c.weight * c.fraction, 0)
  const known = asked.filter((c) => c.status !== 'unknown').reduce((sum, c) => sum + c.weight, 0)

  const exactScore = possible === 0 ? 0 : (earned / possible) * 100
  const score = Math.round(exactScore)
  const label = labelFor(score)

  return {
    cafe,
    score,
    exactScore,
    label,
    // Share of the asked-about criteria where we actually had data (0–1).
    coverage: possible === 0 ? 0 : known / possible,
    criteria,
    summary: buildSummary(label, prefs, criteria),
  }
}

// Highest score first; ties go to the café we know more about, then alphabetical.
export function compareResults(a, b) {
  return (
    b.exactScore - a.exactScore ||
    b.coverage - a.coverage ||
    a.cafe.name.localeCompare(b.cafe.name, 'en') ||
    a.cafe.id.localeCompare(b.cafe.id)
  )
}

/**
 * Scores and ranks every café. Cafés below `minScore` are returned separately,
 * along with how often each criterion was a mismatch, so the UI can suggest
 * which preference to relax instead of showing misleading matches.
 */
export function recommend(cafes, prefs, { minScore = DEFAULT_MIN_SCORE } = {}) {
  const scored = cafes.map((cafe) => scoreCafe(cafe, prefs)).sort(compareResults)
  const results = scored.filter((entry) => entry.score >= minScore)
  const belowThreshold = scored.filter((entry) => entry.score < minScore)

  const mismatchCounts = Object.fromEntries(Object.keys(WEIGHTS).map((id) => [id, 0]))
  for (const entry of scored) {
    for (const criterion of entry.criteria) {
      if (criterion.status === 'mismatch') mismatchCounts[criterion.id] += 1
    }
  }

  return { results, belowThreshold, mismatchCounts, total: cafes.length }
}
