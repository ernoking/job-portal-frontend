/**
 * Applications Store
 *
 * Module-level state store for job applications across 5 stages:
 * Saved, Applied, Responded, Interviewed, Offered.
 *
 * Persisted in sessionStorage keyed by user ID.
 */

const cache = new Map();
const listeners = new Set();

function getStorageKey(userId) {
  return `matchwise_applications_${userId || 'guest'}`;
}

function loadFromStorage(userId) {
  const key = getStorageKey(userId);
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            Saved: Array.isArray(parsed.Saved) ? parsed.Saved : [],
            Applied: Array.isArray(parsed.Applied) ? parsed.Applied : [],
            Responded: Array.isArray(parsed.Responded) ? parsed.Responded : [],
            Interviewed: Array.isArray(parsed.Interviewed) ? parsed.Interviewed : [],
            Offered: Array.isArray(parsed.Offered) ? parsed.Offered : [],
          };
        }
      }
    }
  } catch {
    // sessionStorage disabled or unavailable
  }

  return {
    Saved: [],
    Applied: [],
    Responded: [],
    Interviewed: [],
    Offered: [],
  };
}

function persistToStorage(userId, state) {
  const key = getStorageKey(userId);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(state));
    }
  } catch {
    // ignore quota errors
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

/**
 * Returns the current application columns for the given user.
 */
export function getApplications(userId) {
  const effectiveId = userId || 'guest';
  if (!cache.has(effectiveId)) {
    cache.set(effectiveId, loadFromStorage(effectiveId));
  }
  return cache.get(effectiveId);
}

/**
 * Checks whether a job has already been applied to (or reached later stages).
 */
export function isJobApplied(userId, jobId) {
  const state = getApplications(userId);
  const stages = ['Applied', 'Responded', 'Interviewed', 'Offered'];
  return stages.some((stage) => state[stage].some((j) => j.id === jobId));
}

/**
 * Adds a job to the Applied column (idempotent).
 * Removes it from Saved if present.
 */
export function applyToJob(userId, job) {
  if (!job || !job.id) return;
  const effectiveId = userId || 'guest';
  const state = getApplications(effectiveId);

  // If already applied, do nothing
  if (isJobApplied(effectiveId, job.id)) {
    return state;
  }

  const updatedSaved = state.Saved.filter((j) => j.id !== job.id);
  const updatedApplied = [
    { ...job, appliedAt: new Date().toISOString() },
    ...state.Applied,
  ];

  const nextState = {
    ...state,
    Saved: updatedSaved,
    Applied: updatedApplied,
  };

  cache.set(effectiveId, nextState);
  persistToStorage(effectiveId, nextState);
  emitChange();
  return nextState;
}

/**
 * Adds a job to the Saved column (Scope B preparation).
 */
export function saveJob(userId, job) {
  if (!job || !job.id) return;
  const effectiveId = userId || 'guest';
  const state = getApplications(effectiveId);

  if (state.Saved.some((j) => j.id === job.id)) {
    return state;
  }

  const nextState = {
    ...state,
    Saved: [{ ...job, savedAt: new Date().toISOString() }, ...state.Saved],
  };

  cache.set(effectiveId, nextState);
  persistToStorage(effectiveId, nextState);
  emitChange();
  return nextState;
}

/**
 * Moves a job from one column to another.
 */
export function moveJob(userId, jobId, fromCol, toCol) {
  const effectiveId = userId || 'guest';
  const state = getApplications(effectiveId);
  if (!state[fromCol] || !state[toCol] || fromCol === toCol) {
    return state;
  }

  const targetJob = state[fromCol].find((j) => j.id === jobId);
  if (!targetJob) return state;

  const nextFrom = state[fromCol].filter((j) => j.id !== jobId);
  const nextTo = [targetJob, ...state[toCol].filter((j) => j.id !== jobId)];

  const nextState = {
    ...state,
    [fromCol]: nextFrom,
    [toCol]: nextTo,
  };

  cache.set(effectiveId, nextState);
  persistToStorage(effectiveId, nextState);
  emitChange();
  return nextState;
}

/**
 * Subscribes to changes in applications store.
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
