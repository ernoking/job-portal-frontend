import { MOCK_JOBS } from '../mocks/jobs';

/**
 * Fetches matched job listings, optionally filtered.
 *
 * @param {object} [filters]
 * @param {string} [filters.keywords]
 * @param {string} [filters.location]
 * @param {string[]} [filters.workTypes]
 * @param {number} [filters.minMatch]
 * @returns {Promise<Array<object>>}
 */
export async function getMatches(filters) {
  // Mock implementation; backend endpoint can be wired when available
  if (!filters) {
    return [...MOCK_JOBS];
  }

  const { keywords = '', location = '', workTypes = [], minMatch = 0 } = filters;
  const kw = keywords.trim().toLowerCase();
  const loc = location.trim().toLowerCase();

  const filtered = MOCK_JOBS.filter((job) => {
    // Minimum match filter
    if (typeof minMatch === 'number' && job.fit < minMatch) {
      return false;
    }

    // Work type filter
    if (Array.isArray(workTypes) && workTypes.length > 0) {
      if (!workTypes.includes(job.workType)) {
        return false;
      }
    }

    // Location filter
    if (loc && !job.location.toLowerCase().includes(loc)) {
      return false;
    }

    // Keywords filter (title, company, whyMatch, skillsToBuild)
    if (kw) {
      const matchTitle = job.title.toLowerCase().includes(kw);
      const matchCompany = job.company.toLowerCase().includes(kw);
      const matchWhy = Array.isArray(job.whyMatch) && job.whyMatch.some((w) => w.toLowerCase().includes(kw));
      const matchSkills = Array.isArray(job.skillsToBuild) && job.skillsToBuild.some((s) => s.toLowerCase().includes(kw));
      if (!matchTitle && !matchCompany && !matchWhy && !matchSkills) {
        return false;
      }
    }

    return true;
  });

  return filtered;
}

/**
 * Fetches full job details by ID.
 *
 * @param {string} jobId
 * @returns {Promise<object|null>}
 */
export async function getMatchDetail(jobId) {
  const match = MOCK_JOBS.find((j) => j.id === jobId);
  return match || null;
}
