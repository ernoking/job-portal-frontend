import { mockProfile } from '../mocks/profile';
import { USE_MOCK_API } from './config';
import { request } from './http';
import { getDraft, setDraft } from '../onboarding/draftStore';
import { applyPreferencesToProfile } from '../onboarding/applyPreferencesToProfile';
import { getStoredSession } from '../auth/storage';

// TODO(AJSP-5): confirm endpoints, JSON shape and parse-error format with the backend team (AJSP-56, AJSP-57)

export async function getProfile() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const base = structuredClone(mockProfile);
    const session = getStoredSession();
    if (session?.user) {
      const u = session.user;
      const computedName =
        u.firstName && u.lastName
          ? `${u.firstName} ${u.lastName}`
          : u.firstName || u.name || base.personal.name;
      base.personal.name = computedName;
      if (u.email) {
        base.personal.email = u.email;
      }
    }
    const draft = getDraft();
    return applyPreferencesToProfile(base, draft?.preferences);
  }

  const { profile, cvId } = await request('/api/profile');
  setDraft({ cvId });
  return applyPreferencesToProfile(profile, getDraft().preferences);
}

export async function confirmProfile(profile) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true };
  }

  return await request('/api/profile', {
    method: 'PUT',
    timeoutMs: 30_000,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cvId: getDraft().cvId, profile }),
  });
}


export function generateCvProfile(cvId, { signal } = {}) {
  return request(`/api/cv/${encodeURIComponent(cvId)}/profile`, { method: 'POST', signal, timeoutMs: 75_000 });
}
