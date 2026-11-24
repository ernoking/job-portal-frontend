import { mockProfile } from '../mocks/profile.js';
import { USE_MOCK_API } from './config.js';
import { request } from './http.js';
import { getDraft, setDraft } from '../onboarding/draftStore.js';
import { applyPreferencesToProfile } from '../onboarding/applyPreferencesToProfile.js';
import { getStoredSession } from '../auth/storage.js';

import { mergeReview, reviewEdits } from '../onboarding/profileRefresh.js';

export async function getProfile() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const draft = getDraft();

    // Prefer directly extracted candidate profile from the uploaded CV file
    let base = draft?.extractedCvProfile
      ? structuredClone(draft.extractedCvProfile)
      : structuredClone(mockProfile);

    // If not extracted from CV content, fall back to session user
    if (!draft?.extractedCvProfile) {
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
    }

    return applyPreferencesToProfile(base, draft?.preferences);
  }

  const { profile, cvId } = await request('/api/profile');
  setDraft({ cvId });
  return profile;
}

export async function confirmProfile(profile) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true };
  }

  const draft = getDraft();
  let body;
  if (draft.previewId) {
    const preview = await request(`/api/profile/previews/${encodeURIComponent(draft.previewId)}`);
    body = { previewId: draft.previewId, refreshFields: draft.refreshFields || [],
      edits: reviewEdits(preview, draft.refreshFields || [], profile) };
  } else {
    body = { cvId: draft.cvId, profile };
  }
  return await request('/api/profile', {
    method: 'PUT',
    timeoutMs: 30_000,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}


export async function getReviewProfile() {
  const draft = getDraft();
  if (USE_MOCK_API || !draft.previewId) return getProfile();
  const preview = await request(`/api/profile/previews/${encodeURIComponent(draft.previewId)}`);
  setDraft({ reviewPreview: preview, cvId: preview.cvId });
  const merged = mergeReview(preview, draft.refreshFields || []);
  return draft.profile || (preview.baseProfile ? merged : applyPreferencesToProfile(merged, draft.preferences));
}

export async function generateCvProfile(cvId, { signal } = {}) {
  if (USE_MOCK_API) return null;
  const preview = await request(`/api/cv/${encodeURIComponent(cvId)}/profile/preview`, { method: 'POST', signal, timeoutMs: 75_000 });
  const career = (preview.baseProfile || preview.generatedProfile)?.career || {};
  setDraft({ cvId, previewId: preview.previewId, refreshFields: [], profile: null,
    preferences: { roles: (career.targetRoles || '').split(',').map(value => value.trim()).filter(Boolean),
      workTypes: (career.workType || '').split(',').map(value => value.trim()).filter(Boolean),
      seniority: (career.seniority || '').toLowerCase().startsWith('mid') ? 'Mid' :
        (career.seniority || '').toLowerCase().startsWith('intern') ? 'Internship' : career.seniority || '' }, reviewPreview: preview });
  return preview;
}
