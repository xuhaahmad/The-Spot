// Saved cafés and recent searches, kept in the browser's localStorage.
// Pure functions only: they take whatever came out of storage (which may be
// missing, corrupted, or from an older version of the app) and return clean data.

import { isComplete, preferencesFromSearchParams, preferencesToSearchParams } from './preferences.js'

export const SAVED_KEY = 'the-spot:saved'
export const RECENT_KEY = 'the-spot:recent-searches'
export const MAX_RECENT = 5

function isValidDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

/**
 * Saved cafés: [{ id, savedAt }], newest first.
 * Drops malformed entries, duplicates, and cafés that no longer exist.
 */
export function parseSaved(raw, validIds) {
  const known = new Set(validIds)
  const seen = new Set()
  const saved = []
  let removedCount = 0
  for (const entry of Array.isArray(raw) ? raw : []) {
    if (!entry || typeof entry.id !== 'string' || seen.has(entry.id)) continue
    if (!known.has(entry.id)) {
      removedCount += 1
      continue
    }
    seen.add(entry.id)
    saved.push({ id: entry.id, savedAt: isValidDate(entry.savedAt) ? entry.savedAt : null })
  }
  return { saved, removedCount }
}

export function toggleSaved(saved, id, now = new Date().toISOString()) {
  return saved.some((entry) => entry.id === id)
    ? saved.filter((entry) => entry.id !== id)
    : [{ id, savedAt: now }, ...saved]
}

/**
 * Recent searches: [{ query, searchedAt }], newest first. `query` is the
 * results-page URL query. Entries that no longer describe a complete, valid
 * search (for example an area that was removed from the data) are dropped.
 */
export function parseRecent(raw, preferenceOptions) {
  const seen = new Set()
  const recent = []
  for (const entry of Array.isArray(raw) ? raw : []) {
    if (!entry || typeof entry.query !== 'string') continue
    const prefs = preferencesFromSearchParams(new URLSearchParams(entry.query), preferenceOptions)
    if (!isComplete(prefs)) continue
    const query = preferencesToSearchParams(prefs).toString()
    if (seen.has(query)) continue
    seen.add(query)
    recent.push({ query, searchedAt: isValidDate(entry.searchedAt) ? entry.searchedAt : null })
    if (recent.length === MAX_RECENT) break
  }
  return recent
}

/** Adds a search to the top of the list, moving it up if it was already there. */
export function addRecent(recent, prefs, now = new Date().toISOString()) {
  if (!isComplete(prefs)) return recent
  const query = preferencesToSearchParams(prefs).toString()
  return [{ query, searchedAt: now }, ...recent.filter((entry) => entry.query !== query)].slice(0, MAX_RECENT)
}

export function removeRecent(recent, query) {
  return recent.filter((entry) => entry.query !== query)
}
