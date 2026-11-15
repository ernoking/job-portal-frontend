import { request } from './http';
import { MOCK_JOBS } from '../mocks/jobs';

/**
 * Public configuration flag for Jobs endpoints.
 * When VITE_USE_MOCK_JOBS === 'true', mock fixtures from mocks/jobs.js are used.
 * By default (unset or anything else), the helpers call the real backend API
 * at GET /api/jobs and GET /api/jobs/:id.
 */
export const USE_MOCK_JOBS = import.meta.env.VITE_USE_MOCK_JOBS === 'true';

/**
 * Formats backend snake_case employment types (e.g. full_time, part_time)
 * into title case (e.g. Full-time, Part-time).
 *
 * @param {string} val
 * @returns {string}
 */
function formatEmploymentType(val) {
  if (!val) return '';
  if (val.includes('_')) {
    const parts = val.split('_');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase() +
      (parts.length > 1 ? '-' + parts.slice(1).join('-').toLowerCase() : '');
  }
  return val.charAt(0).toUpperCase() + val.slice(1);
}

/**
 * Normalizes a job item from the backend or mock fixture
 * into a consistent shape for UI components.
 *
 * @param {object} item
 * @returns {object|null}
 */
export function normalizeJob(item) {
  if (!item) return null;
  const match = item.match;
  const isScored = match?.status === 'scored' && typeof match?.score === 'number';

  const rawEmployment = item.employmentType || item.seniority || item.jobType || '';
  const formattedEmployment = rawEmployment.includes('_')
    ? formatEmploymentType(rawEmployment)
    : rawEmployment;

  return {
    id: item.id,
    title: item.title || '',
    company: item.company || '',
    companyInitial: item.company?.[0]?.toUpperCase() || '',
    location: item.location || '',
    jobType: item.jobType || '',
    workType: item.workType || '',
    employmentType: formattedEmployment,
    postedAt: item.postedAt || '',
    skills: Array.isArray(item.skills) ? item.skills : [],
    fit: isScored ? match.score : (typeof item.fit === 'number' ? item.fit : null),
    whyMatch: Array.isArray(match?.matchedSkills) && match.matchedSkills.length > 0
      ? match.matchedSkills
      : (Array.isArray(item.whyMatch) ? item.whyMatch : []),
    skillsToBuild: Array.isArray(match?.missingSkills) && match.missingSkills.length > 0
      ? match.missingSkills
      : (Array.isArray(item.skillsToBuild) ? item.skillsToBuild : []),
    description: item.description || '',
    aboutRole: item.description || item.aboutRole || '',
    requirements: item.requirements || '',
    url: item.url || '',
  };
}

/**
 * Filters a list of normalized jobs client-side according to active filters.
 * Note: The backend GET /api/jobs only accepts sort, page, and pageSize query parameters;
 * keywords, location, workType, and minMatch are filtered client-side.
 * A role without a fit value is NOT excluded by the minimum-match filter.
 *
 * @param {Array<object>} jobs
 * @param {object} [filters]
 * @returns {Array<object>}
 */
export function filterJobs(jobs, filters) {
  if (!filters || !Array.isArray(jobs)) return jobs || [];

  const {
    keywords = '',
    location = '',
    workTypes = [],
    minMatch = 0,
  } = filters;

  const kw = keywords.trim().toLowerCase();
  const loc = location.trim().toLowerCase();

  return jobs.filter((job) => {
    // Minimum match filter: roles without a numeric fit value are not excluded
    if (typeof minMatch === 'number' && typeof job.fit === 'number') {
      if (job.fit < minMatch) {
        return false;
      }
    }

    // Work type filter (case-insensitive comparison against job.workType)
    // Only apply workType filtering when active filters are present and the job defines a workType.
    // When job.workType is missing/empty, bypass filtering so real API jobs are never rejected.
    if (Array.isArray(workTypes) && workTypes.length > 0 && job.workType) {
      const jobWorkType = job.workType.toLowerCase();
      const matchesWorkType = workTypes.some(
        (wt) => wt.toLowerCase() === jobWorkType
      );
      if (!matchesWorkType) {
        return false;
      }
    }

    // Location filter (case-insensitive substring match)
    if (loc) {
      const jobLoc = (job.location || '').toLowerCase();
      if (!jobLoc.includes(loc)) {
        return false;
      }
    }

    // Keywords filter (title, company, skills, whyMatch, skillsToBuild)
    if (kw) {
      const inTitle = (job.title || '').toLowerCase().includes(kw);
      const inCompany = (job.company || '').toLowerCase().includes(kw);
      const inSkills = Array.isArray(job.skills) && job.skills.some((s) => s.toLowerCase().includes(kw));
      const inWhy = Array.isArray(job.whyMatch) && job.whyMatch.some((w) => w.toLowerCase().includes(kw));
      const inSkillsToBuild = Array.isArray(job.skillsToBuild) && job.skillsToBuild.some((s) => s.toLowerCase().includes(kw));
      if (!inTitle && !inCompany && !inSkills && !inWhy && !inSkillsToBuild) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Fetches matched job listings from GET /api/jobs (or mock fixtures).
 * If the real backend reports totalPages > 1, all remaining pages are fetched
 * and combined before normalizing and client-side filtering.
 *
 * @param {object} [filters]
 * @returns {Promise<{ jobs: Array<object>, total: number }>}
 */
export async function getMatches(filters) {
  let normalized;

  if (USE_MOCK_JOBS) {
    normalized = MOCK_JOBS.map(normalizeJob);
  } else {
    // Backend supports sort=best_fit, page, and pageSize up to 50
    const page1Data = await request('/jobs?sort=best_fit&page=1&pageSize=50');
    const allRawJobs = Array.isArray(page1Data?.jobs) ? [...page1Data.jobs] : [];
    const totalPages = typeof page1Data?.totalPages === 'number' ? page1Data.totalPages : 1;

    // Fetch all remaining pages if multi-page results exist
    if (totalPages > 1) {
      const remainingPromises = [];
      for (let p = 2; p <= totalPages; p += 1) {
        remainingPromises.push(request(`/jobs?sort=best_fit&page=${p}&pageSize=50`));
      }
      const remainingPages = await Promise.all(remainingPromises);
      for (const pageRes of remainingPages) {
        if (Array.isArray(pageRes?.jobs)) {
          allRawJobs.push(...pageRes.jobs);
        }
      }
    }

    normalized = allRawJobs.map(normalizeJob);
  }

  const filtered = filters ? filterJobs(normalized, filters) : normalized;

  return {
    jobs: filtered,
    total: filtered.length,
  };
}

/**
 * Fetches all matched jobs across pages before client-side filtering.
 * Alias for getMatches to satisfy external callers.
 *
 * @param {object} [filters]
 * @returns {Promise<{ jobs: Array<object>, total: number }>}
 */
export async function fetchJobs(filters) {
  return getMatches(filters);
}

/**
 * Fetches full job details by ID from GET /api/jobs/:id (or mock fixtures).
 *
 * @param {string} jobId
 * @returns {Promise<object|null>}
 */
export async function getMatchDetail(jobId) {
  if (USE_MOCK_JOBS) {
    const match = MOCK_JOBS.find((j) => j.id === jobId);
    return match ? normalizeJob(match) : null;
  }

  const res = await request(`/jobs/${encodeURIComponent(jobId)}`);
  if (!res || !res.job) return null;

  return normalizeJob({
    ...res.job,
    match: res.match,
    application: res.application,
  });
}
