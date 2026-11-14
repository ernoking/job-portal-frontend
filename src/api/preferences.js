import { mockPreferences } from '../mocks/preferences';
import { getDraft, setDraft } from '../onboarding/draftStore';

// Preferences are kept in the onboarding draft until the profile is confirmed.
export async function getPreferences() {
  return structuredClone(getDraft().preferences ?? mockPreferences);
}

export async function savePreferences(preferences) {
  setDraft({ preferences });
  return { success: true };
}
