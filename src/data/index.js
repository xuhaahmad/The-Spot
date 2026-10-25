// Single entry point for café data. The JSON is bundled with the app,
// so there is no network loading — but the file can still be malformed,
// which is reported as an error state instead of crashing the page.

import rawDataset from './cafes.json'
import { getAreaOptions, getFilterableFacilities, loadCafeDataset } from '../lib/cafes.js'

let cached = null

export function getCafeDataset() {
  if (!cached) {
    try {
      cached = { status: 'ready', ...loadCafeDataset(rawDataset) }
      if (cached.skipped.length > 0) {
        console.warn('Some café records were skipped:', cached.skipped)
      }
    } catch (error) {
      cached = { status: 'error', message: error.message, cafes: [], sources: {}, meta: {}, skipped: [] }
    }
  }
  return cached
}

// Areas and facilities that actually appear in the data. Used to validate
// preferences coming from storage or the URL.
let preferenceOptions = null

export function getPreferenceOptions() {
  if (!preferenceOptions) {
    const { cafes } = getCafeDataset()
    preferenceOptions = { areaOptions: getAreaOptions(cafes), facilityOptions: getFilterableFacilities(cafes) }
  }
  return preferenceOptions
}
