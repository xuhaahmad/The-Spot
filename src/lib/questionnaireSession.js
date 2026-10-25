// The in-progress questionnaire is kept in sessionStorage (this tab only),
// so a refresh mid-way doesn't lose answers. The results page also writes
// here so "Adjust preferences" reopens the questionnaire with the same answers.

import { readJSON, removeKey, writeJSON } from './storage.js'

const KEY = 'the-spot:questionnaire'

export function readQuestionnaire() {
  return readJSON(KEY, { kind: 'session' })
}

export function saveQuestionnaire(prefs, stepIndex) {
  return writeJSON(KEY, { prefs, stepIndex }, { kind: 'session' })
}

export function clearQuestionnaire() {
  return removeKey(KEY, { kind: 'session' })
}
