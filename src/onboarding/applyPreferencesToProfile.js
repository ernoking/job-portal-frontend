const SENIORITY_MAP = {
  Internship: 'Internship',
  Junior: 'Junior',
  Mid: 'Mid\u2013level',
  Senior: 'Senior',
};

/**
 * Pure function that applies onboarding draft preferences to a profile fixture.
 *
 * Rules:
 * - Target roles: roles joined with ', ' (cloned.career.targetRoles)
 * - Work type: work types joined with ', ' (cloned.career.workType)
 * - Seniority: mapped using SENIORITY_MAP (Internship -> Internship, Junior -> Junior, Mid -> Mid–level, Senior -> Senior)
 * - Personal-information location is NOT derived from the preferred location.
 * - Minimum salary and minimum match quality remain in the draft only.
 */
export function applyPreferencesToProfile(profile, preferences) {
  if (!profile || !preferences) {
    return profile;
  }

  const cloned = structuredClone(profile);
  const career = { ...(cloned.career || {}) };

  if (Array.isArray(preferences.roles)) {
    career.targetRoles = preferences.roles.join(', ');
  }

  if (Array.isArray(preferences.workTypes)) {
    career.workType = preferences.workTypes.join(', ');
  }

  if (preferences.seniority) {
    career.seniority = SENIORITY_MAP[preferences.seniority] || preferences.seniority;
  }

  cloned.career = career;
  return cloned;
}
