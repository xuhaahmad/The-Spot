// Copy and options for each questionnaire step. Option values come from
// src/lib/vocabulary.js so they always match the café data.

import { BUDGET_RANGES } from '../../lib/preferences.js'
import { ATMOSPHERE_LABELS, FACILITY_LABELS, MOOD_LABELS, PURPOSE_LABELS } from '../../lib/vocabulary.js'

const PURPOSE_DESCRIPTIONS = {
  study: 'Reading, assignments, exam prep',
  work: 'Laptop, calls, getting things done',
  friends: 'Room to talk and hang out',
  group: 'Room for the whole group',
  solo: 'Time to yourself',
  'casual-meetup': 'A quick coffee with someone',
}

const MOOD_DESCRIPTIONS = {
  cozy: 'Warm and tucked-in',
  productive: 'Focused, heads-down',
  social: 'Chatty and around people',
  relaxed: 'Slow and easy-going',
  energetic: 'Upbeat and buzzing',
}

const BUDGET_DESCRIPTIONS = {
  'under-1000': 'Keeping it simple',
  '1000-1500': 'A drink and a bite',
  '1500-2500': 'A proper treat',
  '2500-plus': 'Going all out',
  any: 'Show me everything',
}

function toOptions(labels, descriptions = {}) {
  return Object.entries(labels).map(([value, label]) => ({ value, label, description: descriptions[value] }))
}

export const PURPOSE_OPTIONS = toOptions(PURPOSE_LABELS, PURPOSE_DESCRIPTIONS)
export const MOOD_OPTIONS = toOptions(MOOD_LABELS, MOOD_DESCRIPTIONS)
export const ATMOSPHERE_OPTIONS = toOptions(ATMOSPHERE_LABELS)
export const BUDGET_OPTIONS = BUDGET_RANGES.map((range) => ({
  value: range.id,
  label: range.label,
  description: BUDGET_DESCRIPTIONS[range.id],
}))

export function facilityOptionsFor(keys) {
  return keys.map((key) => ({ value: key, label: FACILITY_LABELS[key] }))
}

export function areaOptionsFor(areas) {
  return areas.map((area) => ({ value: area, label: area }))
}

export const STEP_COPY = {
  purpose: {
    title: 'What’s the plan?',
    hint: 'Pick the one that fits best.',
    summaryLabel: 'Plan',
  },
  moods: {
    title: 'What kind of mood are you in?',
    hint: 'Pick one or two.',
    summaryLabel: 'Mood',
  },
  budget: {
    title: 'What’s your budget?',
    hint: 'Per person, in Pakistani rupees (PKR). Think one drink and something to eat.',
    summaryLabel: 'Budget per person',
  },
  areas: {
    title: 'Where in Islamabad?',
    hint: 'Optional. Pick any areas that work for you, or skip to see cafés anywhere in the city.',
    summaryLabel: 'Areas',
  },
  extras: {
    title: 'Anything else that matters?',
    hint: 'Optional. These help with ranking, but no café has to tick every box.',
    summaryLabel: 'Extras',
  },
}
