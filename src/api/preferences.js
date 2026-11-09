import { mockPreferences } from '../mocks/preferences';
import { USE_MOCK_API } from './config';
import { request } from './http';
import { getDraft, setDraft } from '../onboarding/draftStore';

// TODO(AJSP-5): confirm endpoints, request/response shape, file upload format (multipart) and error format with the backend team

export async function getPreferences() {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const draft = getDraft();
    if (draft?.preferences) {
      return structuredClone(draft.preferences);
    }
    return structuredClone(mockPreferences);
  }

  const data = await request('/api/preferences');
  if (data) {
    setDraft({ preferences: data });
  }
  return data;
}

export async function savePreferences(preferences) {
  if (USE_MOCK_API) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setDraft({ preferences });
    return { success: true };
  }

  const res = await request('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  setDraft({ preferences });
  return res;
}

