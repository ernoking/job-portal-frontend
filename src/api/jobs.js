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
 * Maximum number of pages to retrieve sequentially during feed hydration (250 jobs max).
 * Prevents unbounded ranking and query load on the backend.
 */
export const MAX_PAGES_TO_FETCH = 5;

/**
 * Fetches a batch of pages sequentially from startPage up to totalPages,
 * capped at maxPagesToFetch.
 *
 * @param {number} startPage
 * @param {number} totalPages
 * @param {number} [maxPagesToFetch=MAX_PAGES_TO_FETCH]
 * @returns {Promise<{
 *   jobs: Array<object>,
 *   loadedPages: Array<number>,
 *   failedPages: Array<number>,
 *   nextPageToLoad: number|null
 * }>}
 */
export async function fetchMorePages(startPage, totalPages, maxPagesToFetch = MAX_PAGES_TO_FETCH) {
  const rawJobs = [];
  const loadedPages = [];
  const failedPages = [];

  const endPage = Math.min(startPage + maxPagesToFetch - 1, totalPages);

  for (let p = startPage; p <= endPage; p += 1) {
    try {
      const res = await request(`/jobs?sort=best_fit&page=${p}&pageSize=50`);
      if (Array.isArray(res?.jobs)) {
        rawJobs.push(...res.jobs);
      }
      loadedPages.push(p);
    } catch (err) {
      console.warn(`[jobsApi] Failed to fetch page ${p} of ${totalPages}:`, err);
      failedPages.push(p);
    }
  }

  const nextPageToLoad = endPage < totalPages ? endPage + 1 : null;

  return {
    jobs: rawJobs.map(normalizeJob),
    loadedPages,
    failedPages,
    nextPageToLoad,
  };
}

/**
 * Retries fetching specific failed pages sequentially.
 *
 * @param {Array<number>} pagesToRetry
 * @returns {Promise<{
 *   jobs: Array<object>,
 *   recoveredPages: Array<number>,
 *   stillFailedPages: Array<number>
 * }>}
 */
export async function retryFailedPages(pagesToRetry = []) {
  const rawJobs = [];
  const recoveredPages = [];
  const stillFailedPages = [];

  for (const p of pagesToRetry) {
    try {
      const res = await request(`/jobs?sort=best_fit&page=${p}&pageSize=50`);
      if (Array.isArray(res?.jobs)) {
        rawJobs.push(...res.jobs);
      }
      recoveredPages.push(p);
    } catch (err) {
      console.warn(`[jobsApi] Retry failed for page ${p}:`, err);
      stillFailedPages.push(p);
    }
  }

  return {
    jobs: rawJobs.map(normalizeJob),
    recoveredPages,
    stillFailedPages,
  };
}

/**
 * Formats snake_case or lowercase labels (e.g. full_time, mid_level, junior)
 * into title case (e.g. Full-time, Mid-level, Junior).
 *
 * @param {string} val
 * @returns {string}
 */
export function formatLabel(val) {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (trimmed.includes('_')) {
    const parts = trimmed.split('_');
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[0].slice(1).toLowerCase() +
      (parts.length > 1 ? '-' + parts.slice(1).join('-').toLowerCase() : '')
    );
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
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

  const rawEmployment = item.jobType || item.employmentType || '';
  const employmentType = formatLabel(rawEmployment);
  const seniority = formatLabel(item.seniority || '');

  return {
    id: item.id,
    title: item.title || '',
    company: item.company || '',
    companyInitial: item.company?.[0]?.toUpperCase() || '',
    location: item.location || '',
    jobType: item.jobType || '',
    workType: item.workType || '',
    employmentType,
    seniority,
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
 * If the real backend reports totalPages > 1, remaining pages are fetched
 * sequentially up to MAX_PAGES_TO_FETCH (5 pages / 250 jobs max). Each subsequent
 * page fetch is wrapped in a try/catch so a failure on page p preserves jobs
 * already collected rather than failing the entire feed.
 *
 * Returns structured metadata alongside the jobs array:
 * { jobs, allJobs, total, totalPages, loadedPages, failedPages, nextPageToLoad, isIncomplete }
 *
 * @param {object} [filters]
 * @returns {Promise<{
 *   jobs: Array<object>,
 *   allJobs: Array<object>,
 *   total: number,
 *   totalPages: number,
 *   loadedPages: Array<number>,
 *   failedPages: Array<number>,
 *   nextPageToLoad: number|null,
 *   isIncomplete: boolean
 * }>}
 */
export async function getMatches(filters) {
  if (USE_MOCK_JOBS) {
    const normalized = MOCK_JOBS.map(normalizeJob);
    const filtered = filters ? filterJobs(normalized, filters) : normalized;
    return {
      jobs: filtered,
      allJobs: normalized,
      total: filtered.length,
      totalPages: 1,
      loadedPages: [1],
      failedPages: [],
      nextPageToLoad: null,
      isIncomplete: false,
    };
  }

  // Backend supports sort=best_fit, page, and pageSize up to 50
  const page1Data = await request('/jobs?sort=best_fit&page=1&pageSize=50');
  const allRawJobs = Array.isArray(page1Data?.jobs) ? [...page1Data.jobs] : [];
  const totalPages = typeof page1Data?.totalPages === 'number' ? page1Data.totalPages : 1;

  const loadedPages = [1];
  const failedPages = [];

  // Fetch remaining pages sequentially up to MAX_PAGES_TO_FETCH
  if (totalPages > 1) {
    const maxPages = Math.min(totalPages, MAX_PAGES_TO_FETCH);
    for (let p = 2; p <= maxPages; p += 1) {
      try {
        const pageRes = await request(`/jobs?sort=best_fit&page=${p}&pageSize=50`);
        if (Array.isArray(pageRes?.jobs)) {
          allRawJobs.push(...pageRes.jobs);
        }
        loadedPages.push(p);
      } catch (pageErr) {
        console.warn(`[getMatches] Failed to fetch page ${p} of ${totalPages}:`, pageErr);
        failedPages.push(p);
      }
    }
  }

  const normalized = allRawJobs.map(normalizeJob);
  const filtered = filters ? filterJobs(normalized, filters) : normalized;

  const lastAttemptedPage = Math.min(totalPages, MAX_PAGES_TO_FETCH);
  const nextPageToLoad = lastAttemptedPage < totalPages ? lastAttemptedPage + 1 : null;
  const isIncomplete = failedPages.length > 0 || nextPageToLoad !== null;

  return {
    jobs: filtered,
    allJobs: normalized,
    total: filtered.length,
    totalPages,
    loadedPages,
    failedPages,
    nextPageToLoad,
    isIncomplete,
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
