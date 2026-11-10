const STORAGE_KEY = 'matchwise_auth'

/**
 * Reads the stored session from localStorage or sessionStorage.
 * Wrapped in try/catch to safely handle disabled or restricted storage.
 *
 * @returns {{ token: string, expiresAt?: number, user?: object, storage: 'local' | 'session' } | null}
 */
export function getStoredSession() {
  try {
    const local = localStorage.getItem(STORAGE_KEY)
    if (local) {
      const parsed = JSON.parse(local)
      if (parsed && typeof parsed.token === 'string') {
        return { ...parsed, storage: 'local' }
      }
    }
  } catch {
    // Ignore storage read errors
  }

  try {
    const session = sessionStorage.getItem(STORAGE_KEY)
    if (session) {
      const parsed = JSON.parse(session)
      if (parsed && typeof parsed.token === 'string') {
        return { ...parsed, storage: 'session' }
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return null
}

/**
 * Persists session data to localStorage (if rememberMe is true) or sessionStorage.
 * Purges the opposite storage to prevent conflicting states.
 *
 * @param {{ token: string, expiresAt?: number, user?: object }} sessionData
 * @param {boolean} [rememberMe=false]
 */
export function setStoredSession(sessionData, rememberMe = false) {
  const payload = JSON.stringify({
    token: sessionData.token,
    expiresAt: sessionData.expiresAt,
    user: sessionData.user,
  })

  if (rememberMe) {
    try {
      localStorage.setItem(STORAGE_KEY, payload)
    } catch {
      // Ignore storage write errors
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage write errors
    }
  } else {
    try {
      sessionStorage.setItem(STORAGE_KEY, payload)
    } catch {
      // Ignore storage write errors
    }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore storage write errors
    }
  }
}

/**
 * Purges session data from both localStorage and sessionStorage.
 */
export function clearStoredSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore storage errors
  }
}
