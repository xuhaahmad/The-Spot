import { describe, expect, it } from 'vitest'
import { createPreferences } from './preferences.js'
import { MAX_RECENT, addRecent, parseRecent, parseSaved, removeRecent, toggleSaved } from './personalStore.js'
import { readJSON, writeJSON } from './storage.js'

const IDS = ['a', 'b', 'c']
const OPTIONS = { areaOptions: ['F-6', 'F-7'], facilityOptions: ['wifi'] }
const T1 = '2026-10-01T10:00:00.000Z'
const T2 = '2026-10-02T10:00:00.000Z'

describe('saved cafés', () => {
  it('saves newest first and unsaves', () => {
    let saved = toggleSaved([], 'a', T1)
    saved = toggleSaved(saved, 'b', T2)
    expect(saved).toEqual([
      { id: 'b', savedAt: T2 },
      { id: 'a', savedAt: T1 },
    ])
    expect(toggleSaved(saved, 'a')).toEqual([{ id: 'b', savedAt: T2 }])
  })

  it('cleans corrupted or outdated storage instead of crashing', () => {
    const raw = [
      { id: 'a', savedAt: T1 },
      { id: 'a', savedAt: T2 }, // duplicate
      { id: 'gone-cafe', savedAt: T1 }, // no longer in the data
      { id: 42 },
      null,
      'b',
      { id: 'c', savedAt: 'not a date' },
    ]
    expect(parseSaved(raw, IDS)).toEqual({
      saved: [
        { id: 'a', savedAt: T1 },
        { id: 'c', savedAt: null },
      ],
      removedCount: 1,
    })
  })

  it('treats non-list values as empty', () => {
    for (const raw of [null, undefined, '{', 7, { id: 'a' }]) {
      expect(parseSaved(raw, IDS)).toEqual({ saved: [], removedCount: 0 })
    }
  })
})

describe('recent searches', () => {
  const study = createPreferences({ purpose: 'study', moods: ['cozy'], budget: 'any' })
  const reunion = createPreferences({ purpose: 'group', moods: ['social'], budget: 'any', areas: ['F-7'] })

  it('adds newest first and moves repeats to the top instead of duplicating', () => {
    let recent = addRecent([], study, T1)
    recent = addRecent(recent, reunion, T2)
    recent = addRecent(recent, study, T2)
    expect(recent.map((r) => r.query)).toEqual([
      'purpose=study&budget=any&moods=cozy',
      'purpose=group&budget=any&moods=social&areas=F-7',
    ])
  })

  it(`keeps at most ${MAX_RECENT}`, () => {
    let recent = []
    const moods = ['cozy', 'productive', 'social', 'relaxed', 'energetic']
    for (const mood of moods) recent = addRecent(recent, createPreferences({ purpose: 'solo', moods: [mood], budget: 'any' }))
    recent = addRecent(recent, createPreferences({ purpose: 'work', moods: ['cozy'], budget: 'any' }))
    expect(recent).toHaveLength(MAX_RECENT)
    expect(recent[0].query).toBe('purpose=work&budget=any&moods=cozy')
  })

  it('ignores incomplete searches', () => {
    expect(addRecent([], createPreferences({ purpose: 'study' }))).toEqual([])
  })

  it('removes one search', () => {
    const recent = addRecent(addRecent([], study, T1), reunion, T2)
    expect(removeRecent(recent, recent[0].query)).toEqual([recent[1]])
  })

  it('drops corrupted, incomplete or outdated entries when loading', () => {
    const raw = [
      { query: 'purpose=group&moods=social&budget=any&areas=F-7', searchedAt: T2 },
      { query: 'purpose=group&budget=any&moods=social&areas=F-7', searchedAt: T1 }, // same search, other order
      { query: 'purpose=study&moods=cozy&budget=any&areas=Atlantis', searchedAt: T1 }, // outdated area is dropped, search kept
      { query: 'purpose=study' }, // incomplete
      { query: 42 },
      'purpose=group',
      null,
    ]
    expect(parseRecent(raw, OPTIONS)).toEqual([
      { query: 'purpose=group&budget=any&moods=social&areas=F-7', searchedAt: T2 },
      { query: 'purpose=study&budget=any&moods=cozy', searchedAt: T1 },
    ])
    expect(parseRecent('garbage', OPTIONS)).toEqual([])
  })

  // The "date" purpose and "romantic" mood were removed from the app.
  // Searches saved before that must not crash anything or come back as broken entries.
  it('drops searches saved with the removed "date" purpose or "romantic" mood', () => {
    const raw = [
      { query: 'purpose=date&budget=any&moods=romantic', searchedAt: T2 }, // purpose and only mood removed
      { query: 'purpose=date&budget=any&moods=cozy', searchedAt: T2 }, // purpose removed, so incomplete
      { query: 'purpose=solo&budget=any&moods=romantic', searchedAt: T2 }, // only mood removed, so incomplete
      { query: 'purpose=solo&budget=any&moods=romantic%2Ccozy', searchedAt: T1 }, // one mood still valid, so kept
    ]
    expect(parseRecent(raw, OPTIONS)).toEqual([{ query: 'purpose=solo&budget=any&moods=cozy', searchedAt: T1 }])
  })
})

describe('when storage is unavailable', () => {
  const blocked = {
    getItem() {
      throw new DOMException('denied', 'SecurityError')
    },
    setItem() {
      throw new DOMException('full', 'QuotaExceededError')
    },
  }

  it('reading gives empty, clean data', () => {
    expect(parseSaved(readJSON('k', { store: blocked }), IDS)).toEqual({ saved: [], removedCount: 0 })
    expect(parseRecent(readJSON('k', { store: blocked }), OPTIONS)).toEqual([])
  })

  it('writing reports failure instead of throwing', () => {
    expect(writeJSON('k', [{ id: 'a' }], { store: blocked })).toBe(false)
  })
})
