import { mockProfile } from '../mocks/profile';
import { USE_MOCK_API } from './config';
import { request } from './http';
import { getDraft } from '../onboarding/draftStore';
import { applyPreferencesToProfile } from '../onboarding/applyPreferencesToProfile';

// TODO(AJSP-5): confirm endpoints, JSON shape and parse-error format with the backend team (AJSP-56, AJSP-57)

export async function getProfile() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const base = structuredClone(mockProfile);
    const draft = getDraft();
    return applyPreferencesToProfile(base, draft?.preferences);
  }

  return await request('/api/profile');
}

export async function confirmProfile(profile) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true };
  }

  return await request('/api/profile/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

