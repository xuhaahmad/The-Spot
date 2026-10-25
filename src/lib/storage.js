// Safe wrappers around browser storage. Storage can be missing, blocked
// (private mode, strict privacy settings) or contain corrupted JSON, so
// every call is guarded and failures fall back quietly.

function getStore(kind) {
  try {
    const store = kind === 'session' ? window.sessionStorage : window.localStorage
    return store ?? null
  } catch {
    return null
  }
}

export function readJSON(key, { kind = 'local', store = getStore(kind) } = {}) {
  try {
    const text = store?.getItem(key)
    return text == null ? null : JSON.parse(text)
  } catch {
    return null
  }
}

export function writeJSON(key, value, { kind = 'local', store = getStore(kind) } = {}) {
  try {
    if (!store) return false
    store.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key, { kind = 'local', store = getStore(kind) } = {}) {
  try {
    store?.removeItem(key)
    return true
  } catch {
    return false
  }
}
