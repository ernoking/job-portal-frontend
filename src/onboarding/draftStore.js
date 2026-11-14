const STORAGE_KEY = 'matchwise_onboarding_draft';

function loadInitialDraft() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            preferences: parsed.preferences || null,
            cvId: typeof parsed.cvId === 'string' ? parsed.cvId : null,
          };
        }
      }
    }
  } catch {
    // sessionStorage unavailable or restricted
  }
  return { preferences: null, cvId: null };
}

let currentDraft = loadInitialDraft();
const listeners = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function persistToStorage(draft) {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  } catch {
    // sessionStorage unavailable, disabled, or quota exceeded
  }
}

export function getDraft() {
  return currentDraft;
}

export function setDraft(partial) {
  currentDraft = {
    ...currentDraft,
    ...partial,
  };
  persistToStorage(currentDraft);
  emitChange();
  return currentDraft;
}

export function clearDraft() {
  currentDraft = { preferences: null, cvId: null };
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  emitChange();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
