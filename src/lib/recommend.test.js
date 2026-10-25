import { describe, expect, it } from 'vitest'
import { normalizeCafe } from './cafes.js'
import { createPreferences } from './preferences.js'
import { DEFAULT_MIN_SCORE, WEIGHTS, compareResults, recommend, scoreCafe } from './recommend.js'

function cafe(overrides = {}) {
  return normalizeCafe({ id: overrides.id ?? 'c', name: overrides.name ?? 'Café', ...overrides }).cafe
}

function prefs(overrides = {}) {
  return createPreferences({ purpose: 'study', moods: ['cozy'], budget: '1000-1500', ...overrides })
}

const criterion = (result, id) => result.criteria.find((c) => c.id === id)

// A café that matches the default preferences on every criterion.
const perfect = cafe({
  id: 'perfect',
  name: 'Perfect',
  area: 'F-7',
  purposes: ['study'],
  moods: ['cozy'],
  atmosphere: ['quiet'],
  estimatedBudgetPerPerson: { min: 1000, max: 1400 },
  facilities: { wifi: true },
})

describe('weights', () => {
  it('add up to 100', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100)
  })
})

describe('exact matches', () => {
  it('scores 100 when every asked preference matches', () => {
    const result = scoreCafe(
      perfect,
      prefs({ areas: ['F-7'], atmosphere: ['quiet'], facilities: ['wifi'] }),
    )
    expect(result.score).toBe(100)
    expect(result.label).toBe('Strong match')
    expect(result.coverage).toBe(1)
    expect(result.criteria.every((c) => c.status === 'match')).toBe(true)
  })

  it('leaves skipped preferences out instead of counting them against the café', () => {
    const result = scoreCafe(perfect, prefs())
    expect(result.score).toBe(100)
    expect(criterion(result, 'location').status).toBe('not-asked')
    expect(criterion(result, 'facilities').status).toBe('not-asked')
  })
})

describe('partial matches', () => {
  it('gives partial credit for a related purpose and says why', () => {
    const result = scoreCafe(cafe({ purposes: ['work'] }), prefs())
    const purpose = criterion(result, 'purpose')
    expect(purpose.status).toBe('partial')
    expect(purpose.fraction).toBe(0.5)
    expect(purpose.reason).toMatch(/working.*also suit studying/i)
  })

  it('gives half mood credit when one of two moods matches', () => {
    const result = scoreCafe(cafe({ moods: ['cozy'] }), prefs({ moods: ['cozy', 'social'] }))
    expect(criterion(result, 'mood')).toMatchObject({ status: 'partial', fraction: 0.5 })
  })

  it('gives partial credit to friends and meetup cafés for a reunion, and says why', () => {
    for (const tag of ['friends', 'casual-meetup']) {
      const purpose = criterion(scoreCafe(cafe({ purposes: [tag] }), prefs({ purpose: 'group' })), 'purpose')
      expect(purpose).toMatchObject({ status: 'partial', fraction: 0.5 })
      expect(purpose.reason).toMatch(/can also suit a reunion or group gathering/)
    }
    expect(criterion(scoreCafe(cafe({ purposes: ['group'] }), prefs({ purpose: 'group' })), 'purpose').status).toBe(
      'match',
    )
    expect(criterion(scoreCafe(cafe({ purposes: ['study'] }), prefs({ purpose: 'group' })), 'purpose').status).toBe(
      'mismatch',
    )
  })

  it('treats calm as a partial match for quiet', () => {
    const result = scoreCafe(cafe({ atmosphere: ['calm'] }), prefs({ atmosphere: ['quiet'] }))
    const atmosphere = criterion(result, 'atmosphere')
    expect(atmosphere.status).toBe('partial')
    expect(atmosphere.reason).toMatch(/calm \(you asked for quiet\)/)
  })

  it('does not need every preference to match to be recommended', () => {
    const half = cafe({ purposes: ['study'], moods: ['social'], estimatedBudgetPerPerson: { min: 800, max: 1200 } })
    const { results } = recommend([half], prefs())
    expect(results).toHaveLength(1)
    expect(results[0].score).toBeGreaterThan(50)
    expect(results[0].score).toBeLessThan(100)
  })
})

describe('budget', () => {
  const budgetOf = (min, max, extra = {}) => cafe({ estimatedBudgetPerPerson: { min, max, ...extra } })

  it('matches when the whole estimate fits, including when it starts below the range', () => {
    expect(criterion(scoreCafe(budgetOf(900, 1450), prefs()), 'budget').status).toBe('match')
  })

  it('counts cheaper-than-range cafés as a match', () => {
    const budget = criterion(scoreCafe(budgetOf(500, 800), prefs()), 'budget')
    expect(budget.status).toBe('match')
    expect(budget.reason).toMatch(/less than the Rs 1,000–1,500 you picked/)
  })

  it('gives partial credit when only some options fit', () => {
    const budget = criterion(scoreCafe(budgetOf(1200, 2000), prefs()), 'budget')
    expect(budget.status).toBe('partial')
    expect(budget.fraction).toBeGreaterThan(0)
    expect(budget.fraction).toBeLessThan(1)
  })

  it('reports a clear mismatch when the café starts above the budget', () => {
    const budget = criterion(scoreCafe(budgetOf(1800, 2500), prefs({ budget: 'under-1000' })), 'budget')
    expect(budget.status).toBe('mismatch')
    expect(budget.fraction).toBe(0)
    expect(budget.reason).toMatch(/from Rs 1,800 per person, above your budget of up to Rs 1,000/)
  })

  it('mentions when an estimate covers one drink only', () => {
    expect(criterion(scoreCafe(budgetOf(600, 900, { includes: 'drink' }), prefs()), 'budget').reason).toMatch(
      /Rs 600–900 for one drink/,
    )
  })

  it('ignores budget entirely for "No fixed budget"', () => {
    expect(criterion(scoreCafe(budgetOf(5000, 9000), prefs({ budget: 'any' })), 'budget').status).toBe('not-asked')
  })
})

describe('missing data', () => {
  const blank = cafe({ id: 'blank', name: 'Blank' })

  it('never treats unknown information as a match', () => {
    const result = scoreCafe(blank, prefs({ areas: ['F-6'], atmosphere: ['quiet'], facilities: ['wifi'] }))
    expect(result.score).toBe(0)
    expect(result.coverage).toBe(0)
    for (const c of result.criteria) expect(c.status).toBe('unknown')
  })

  it('scores unknown lower than a confirmed match but explains it differently from a mismatch', () => {
    const known = cafe({ purposes: ['study'] })
    const wrong = cafe({ purposes: ['solo'] })
    expect(scoreCafe(known, prefs()).score).toBeGreaterThan(scoreCafe(blank, prefs()).score)
    expect(criterion(scoreCafe(blank, prefs()), 'purpose').reason).toMatch(/not enough information/i)
    expect(criterion(scoreCafe(wrong, prefs()), 'purpose').reason).toMatch(/rather than studying/i)
  })

  it('never claims a facility that is not confirmed', () => {
    const result = scoreCafe(cafe({ facilities: { wifi: null } }), prefs({ facilities: ['wifi'] }))
    const facilities = criterion(result, 'facilities')
    expect(facilities.status).toBe('unknown')
    expect(facilities.reason).toMatch(/Wi-Fi not confirmed/)
    expect(result.summary).not.toMatch(/Wi-Fi/)
  })

  it('distinguishes a facility confirmed missing from an unknown one', () => {
    const facilities = criterion(scoreCafe(cafe({ facilities: { wifi: false } }), prefs({ facilities: ['wifi'] })), 'facilities')
    expect(facilities.status).toBe('mismatch')
    expect(facilities.reason).toMatch(/no Wi-Fi according to our sources/i)
  })

  it('handles preferences with nothing to compare without dividing by zero', () => {
    const result = scoreCafe(perfect, createPreferences({ budget: 'any' }))
    expect(result.score).toBe(0)
    expect(Number.isFinite(result.exactScore)).toBe(true)
  })
})

describe('score boundaries', () => {
  it('always stays between 0 and 100', () => {
    const cafes = [perfect, cafe({ id: 'x' }), cafe({ id: 'y', purposes: ['solo'], area: 'I-8' })]
    const allPrefs = [
      prefs(),
      prefs({ areas: ['F-6'], atmosphere: ['quiet', 'lively'], facilities: ['wifi', 'parking'] }),
      prefs({ budget: 'any', moods: ['energetic', 'social'] }),
    ]
    for (const c of cafes) {
      for (const p of allPrefs) {
        const { score, exactScore } = scoreCafe(c, p)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
        expect(exactScore).toBeGreaterThanOrEqual(0)
        expect(exactScore).toBeLessThanOrEqual(100)
      }
    }
  })

  it('stays within bounds for many random preference combinations', () => {
    const purposes = ['study', 'work', 'friends', 'group', 'casual-meetup', 'solo']
    const moods = ['cozy', 'productive', 'social', 'relaxed', 'energetic']
    const budgets = ['under-1000', '1000-1500', '1500-2500', '2500-plus', 'any']
    // Simple seeded generator so the test itself is deterministic.
    let seed = 42
    const rand = (n) => {
      seed = (seed * 1103515245 + 12345) % 2 ** 31
      return seed % n
    }
    for (let i = 0; i < 300; i += 1) {
      const p = prefs({
        purpose: purposes[rand(purposes.length)],
        moods: [moods[rand(moods.length)]],
        budget: budgets[rand(budgets.length)],
      })
      const { score } = scoreCafe(perfect, p)
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('maps scores to labels at the documented thresholds', () => {
    const labelForScore = (fractionPurpose) =>
      scoreCafe(cafe({ purposes: fractionPurpose ? ['study'] : ['solo'], moods: ['cozy'] }), prefs({ budget: 'any' }))
    expect(labelForScore(true).label).toBe('Strong match') // 45/45
    expect(labelForScore(false).score).toBe(44) // 20/45
    expect(labelForScore(false).label).toBe('Partial match')
  })
})

describe('ranking', () => {
  const strong = cafe({ id: 'strong', name: 'Strong', purposes: ['study'], moods: ['cozy'] })
  const medium = cafe({ id: 'medium', name: 'Medium', purposes: ['work'], moods: ['cozy'] })
  const weak = cafe({ id: 'weak', name: 'Weak', purposes: ['solo'], moods: ['energetic'] })

  it('orders cafés from strongest to weakest match', () => {
    const { results, belowThreshold } = recommend([weak, medium, strong], prefs({ budget: 'any' }))
    expect(results.map((r) => r.cafe.id)).toEqual(['strong', 'medium'])
    expect(belowThreshold.map((r) => r.cafe.id)).toEqual(['weak'])
  })

  it('breaks ties by data coverage, then by name', () => {
    const knownMismatch = cafe({ id: 'a', name: 'Zed', purposes: ['solo'], moods: ['cozy'] })
    const unknownPurpose = cafe({ id: 'b', name: 'Alpha', moods: ['cozy'] })
    const sameAsAlpha = cafe({ id: 'c', name: 'Beta', moods: ['cozy'] })
    const { results } = recommend([sameAsAlpha, unknownPurpose, knownMismatch], prefs({ budget: 'any' }), {
      minScore: 0,
    })
    // All score 44; Zed has more known data, then Alpha before Beta alphabetically.
    expect(results.map((r) => r.score)).toEqual([44, 44, 44])
    expect(results.map((r) => r.cafe.name)).toEqual(['Zed', 'Alpha', 'Beta'])
  })

  it('gives identical results for identical inputs, regardless of input order', () => {
    const p = prefs({ areas: ['F-7'] })
    const first = recommend([weak, medium, strong, perfect], p)
    const second = recommend([perfect, strong, weak, medium], p)
    expect(second).toEqual(first)
    expect(recommend([weak, medium, strong, perfect], p)).toEqual(first)
  })

  it('compareResults is a consistent ordering', () => {
    const a = scoreCafe(strong, prefs())
    const b = scoreCafe(weak, prefs())
    expect(compareResults(a, b)).toBeLessThan(0)
    expect(compareResults(b, a)).toBeGreaterThan(0)
    expect(compareResults(a, a)).toBe(0)
  })

  it('does not modify the cafés or preferences it is given', () => {
    const cafes = [strong, weak]
    const p = prefs()
    const before = JSON.stringify({ cafes, p })
    recommend(cafes, p)
    expect(JSON.stringify({ cafes, p })).toBe(before)
  })
})

describe('no suitable cafés', () => {
  it('returns an empty result list and reports which preferences caused it', () => {
    const pricey = cafe({ id: 'p', name: 'Pricey', area: 'F-6', estimatedBudgetPerPerson: { min: 2000, max: 3000 } })
    const far = cafe({ id: 'f', name: 'Far', area: 'I-8', estimatedBudgetPerPerson: { min: 2200, max: 2600 } })
    const outcome = recommend([pricey, far], prefs({ budget: 'under-1000', areas: ['F-7'] }))
    expect(outcome.results).toEqual([])
    expect(outcome.belowThreshold).toHaveLength(2)
    expect(outcome.mismatchCounts.budget).toBe(2)
    expect(outcome.mismatchCounts.location).toBe(2)
  })

  it('handles an empty café list', () => {
    expect(recommend([], prefs())).toMatchObject({ results: [], belowThreshold: [], total: 0 })
  })

  it('uses the documented default threshold', () => {
    expect(DEFAULT_MIN_SCORE).toBe(25)
  })
})

describe('explanations', () => {
  it('reads naturally and only mentions supported positives', () => {
    const result = scoreCafe(perfect, prefs({ areas: ['F-7'], facilities: ['wifi'] }))
    expect(result.summary).toBe(
      'Strong match for studying: tagged for studying, fits your budget, matches your cozy mood, in F-7 and Wi-Fi mentioned in sources.',
    )
  })

  it('says so plainly when little could be confirmed', () => {
    expect(scoreCafe(cafe(), prefs()).summary).toMatch(/few of your preferences could be confirmed/i)
  })
})
