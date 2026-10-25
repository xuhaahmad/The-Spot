import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PersonalContext } from './personal.js'
import { getCafeDataset, getPreferenceOptions } from '../data/index.js'
import {
  RECENT_KEY,
  SAVED_KEY,
  addRecent,
  parseRecent,
  parseSaved,
  removeRecent,
  toggleSaved,
} from '../lib/personalStore.js'
import { readJSON, writeJSON } from '../lib/storage.js'

function validCafeIds() {
  return getCafeDataset().cafes.map((cafe) => cafe.id)
}

// Some browsers (private modes, strict privacy settings) block storage entirely.
function canUseStorage() {
  try {
    const probe = 'the-spot:probe'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function loadSaved() {
  return parseSaved(readJSON(SAVED_KEY), validCafeIds())
}

function loadRecent() {
  return parseRecent(readJSON(RECENT_KEY), getPreferenceOptions())
}

/**
 * Holds saved cafés and recent searches for the whole app. Every change is
 * written to localStorage straight away; if that fails, everything keeps
 * working for this visit and `storageAvailable` becomes false so the UI can say so.
 */
export function PersonalProvider({ children }) {
  const [initial] = useState(() => ({ ...loadSaved(), recent: loadRecent(), storageAvailable: canUseStorage() }))
  const [saved, setSaved] = useState(initial.saved)
  const [recent, setRecent] = useState(initial.recent)
  const [storageAvailable, setStorageAvailable] = useState(initial.storageAvailable)
  const [removedCount, setRemovedCount] = useState(initial.removedCount)

  // Refs mirror the latest lists so the actions below can stay stable
  // (components can depend on them without re-running effects).
  const savedRef = useRef(saved)
  const recentRef = useRef(recent)

  const persist = useCallback((key, value) => {
    if (!writeJSON(key, value)) setStorageAvailable(false)
  }, [])

  const updateSaved = useCallback(
    (next) => {
      savedRef.current = next
      setSaved(next)
      persist(SAVED_KEY, next)
    },
    [persist],
  )

  const updateRecent = useCallback(
    (next) => {
      recentRef.current = next
      setRecent(next)
      persist(RECENT_KEY, next)
    },
    [persist],
  )

  // Write the cleaned data back once, which repairs anything corrupted in storage.
  useEffect(() => {
    writeJSON(SAVED_KEY, savedRef.current)
    writeJSON(RECENT_KEY, recentRef.current)
  }, [])

  // Keep several open tabs in step. (Browsers only notify other tabs when a
  // stored value actually changes, so tabs can't ping-pong updates forever.)
  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== SAVED_KEY && event.key !== RECENT_KEY && event.key !== null) return
      if (event.key !== RECENT_KEY) {
        savedRef.current = loadSaved().saved
        setSaved(savedRef.current)
      }
      if (event.key !== SAVED_KEY) {
        recentRef.current = loadRecent()
        setRecent(recentRef.current)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const toggle = useCallback((id) => updateSaved(toggleSaved(savedRef.current, id)), [updateSaved])
  const clearSaved = useCallback(() => updateSaved([]), [updateSaved])
  const recordSearch = useCallback((prefs) => updateRecent(addRecent(recentRef.current, prefs)), [updateRecent])
  const forgetSearch = useCallback((query) => updateRecent(removeRecent(recentRef.current, query)), [updateRecent])
  const clearRecent = useCallback(() => updateRecent([]), [updateRecent])
  const dismissRemovedNotice = useCallback(() => setRemovedCount(0), [])

  const value = useMemo(() => {
    const savedIds = new Set(saved.map((entry) => entry.id))
    return {
      saved,
      recent,
      storageAvailable,
      removedCount,
      isSaved: (id) => savedIds.has(id),
      toggleSaved: toggle,
      clearSaved,
      recordSearch,
      forgetSearch,
      clearRecent,
      dismissRemovedNotice,
    }
  }, [saved, recent, storageAvailable, removedCount, toggle, clearSaved, recordSearch, forgetSearch, clearRecent, dismissRemovedNotice])

  return <PersonalContext.Provider value={value}>{children}</PersonalContext.Provider>
}
