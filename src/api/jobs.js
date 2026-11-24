import { request } from './http.js';
import { MOCK_JOBS } from '../mocks/jobs.js';
import { flattenJobPages } from './jobPages.js';

const WORK_TYPES = { remote: 'remote', hybrid: 'hybrid', on_site: 'on_site', 'on-site': 'on_site', unknown: 'unknown' };
export function canonicalWorkType(value) {
  return WORK_TYPES[String(value || '').toLowerCase()] || 'unknown';
}
function jobsPath(page, filters = {}) {
  const params = new URLSearchParams({ sort: 'best_fit', page: String(page), pageSize: '50' });
  const types = [...new Set((filters.workTypes || []).map(canonicalWorkType))];
  if (types.length) params.set('workType', types.join(','));
  return `/jobs?${params}`;
}

/**
 * Public configuration flag for Jobs endpoints.
 * When VITE_USE_MOCK_JOBS === 'true', mock fixtures from mocks/jobs.js are used.
 * By default (unset or anything else), the helpers call the real backend API
 * at GET /api/jobs and GET /api/jobs/:id.
 */
export const USE_MOCK_JOBS = import.meta.env?.VITE_USE_MOCK_JOBS === 'true';

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
 *   pages: Record<number, Array<object>>,
 *   loadedPages: Array<number>,
 *   failedPages: Array<number>,
 *   nextPageToLoad: number|null
 * }>}
 */
export async function fetchMorePages(startPage, totalPages, maxPagesToFetch = MAX_PAGES_TO_FETCH, filters = {}) {
  const pages = {};
  const loadedPages = [];
  const failedPages = [];

  const endPage = Math.min(startPage + maxPagesToFetch - 1, totalPages);

  for (let p = startPage; p <= endPage; p += 1) {
    try {
      const res = await request(jobsPath(p, filters));
      pages[p] = (Array.isArray(res?.jobs) ? res.jobs : []).map(normalizeJob);
      loadedPages.push(p);
    } catch (err) {
      console.warn(`[jobsApi] Failed to fetch page ${p} of ${totalPages}:`, err);
      failedPages.push(p);
    }
  }

  const nextPageToLoad = endPage < totalPages ? endPage + 1 : null;

  return {
    pages,
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
 *   pages: Record<number, Array<object>>,
 *   recoveredPages: Array<number>,
 *   stillFailedPages: Array<number>
 * }>}
 */
export async function retryFailedPages(pagesToRetry = [], filters = {}) {
  const pages = {};
  const recoveredPages = [];
  const stillFailedPages = [];

  for (const p of pagesToRetry) {
    try {
      const res = await request(jobsPath(p, filters));
      pages[p] = (Array.isArray(res?.jobs) ? res.jobs : []).map(normalizeJob);
      recoveredPages.push(p);
    } catch (err) {
      console.warn(`[jobsApi] Retry failed for page ${p}:`, err);
      stillFailedPages.push(p);
    }
  }

  return {
    pages,
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

  const desc = item.description || '';
  let parsedAbout = item.aboutRole || desc;
  let parsedResp = Array.isArray(item.keyResponsibilities) ? item.keyResponsibilities : null;
  let parsedQual = Array.isArray(item.requirementsQualifications) ? item.requirementsQualifications : null;
  let parsedBen = Array.isArray(item.benefitsCompensation) ? item.benefitsCompensation : null;

  if (desc && (!parsedResp || !parsedQual)) {
    const doRegex = /(?:^|\n|(?<=[.!?])\s+|[A-Za-z0-9]\s+)(WHAT YOU[’']LL DO|RESPONSIBILITIES|KEY RESPONSIBILITIES)\s*:/i;
    const bringRegex = /(?:^|\n|(?<=[.!?])\s+|[A-Za-z0-9]\s+)(WHAT YOU[’']LL BRING|WHAT YOU NEED|REQUIREMENTS|QUALIFICATIONS)\s*:/i;
    const offerRegex = /(?:^|\n|(?<=[.!?])\s+|[A-Za-z0-9]\s+)(WHAT WE OFFER|BENEFITS|COMPENSATION)\s*:/i;

    const doMatch = doRegex.exec(desc);
    const bringMatch = bringRegex.exec(desc);
    const offerMatch = offerRegex.exec(desc);

    if (doMatch && bringMatch) {
      const doPos = doMatch.index + doMatch[0].indexOf(doMatch[1]);
      const bringPos = bringMatch.index + bringMatch[0].indexOf(bringMatch[1]);
      const offerPos = offerMatch ? offerMatch.index + offerMatch[0].indexOf(offerMatch[1]) : desc.length;

      if (!item.aboutRole) {
        parsedAbout = desc.slice(0, doPos).trim();
      }
      if (!parsedResp) {
        const respText = desc.slice(doPos + doMatch[1].length + 1, bringPos).trim();
        parsedResp = respText.split(/\s*-\s+/).map((s) => s.trim()).filter((s) => s.length > 5).slice(0, 4);
      }
      if (!parsedQual) {
        const qualText = desc.slice(bringPos + bringMatch[1].length + 1, offerPos).trim();
        parsedQual = qualText.split(/\s*-\s+/).map((s) => s.trim()).filter((s) => s.length > 5).slice(0, 4);
      }
      if (offerMatch && !parsedBen) {
        const benText = desc.slice(offerPos + offerMatch[1].length + 1).trim();
        parsedBen = benText.split(/\s*-\s+/).map((s) => s.trim()).filter((s) => s.length > 5).slice(0, 4);
      }
    } else if (item.requirements) {
      if (!parsedQual) {
        parsedQual = item.requirements.split(/[,;\n•]+/).map((s) => s.trim()).filter(Boolean);
      }
    }
  }

  return {
    id: item.id,
    title: item.title || '',
    company: item.company || '',
    companyInitial: item.company?.[0]?.toUpperCase() || '',
    location: item.location || '',
    jobType: item.jobType || '',
    workType: { remote: 'Remote', hybrid: 'Hybrid', on_site: 'On-site', unknown: '' }[canonicalWorkType(item.workType)],
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
    aboutRole: parsedAbout,
    requirements: item.requirements || '',
    url: item.url || '',
    transferableSkills: item.transferableSkills || null,
    keyResponsibilities: parsedResp,
    requirementsQualifications: parsedQual,
    benefitsCompensation: parsedBen,
    application: item.application || null,
  };
}

/**
 * Filters a list of normalized jobs client-side according to active filters.
 * Work arrangement is also sent to the backend before pagination. Keywords, location
 * and minimum match retain the existing client-side behavior.
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

    // Unknown/missing metadata must not pass an explicit arrangement selection.
    if (Array.isArray(workTypes) && workTypes.length > 0 &&
        !workTypes.some((type) => canonicalWorkType(type) === canonicalWorkType(job.workType))) {
      return false;
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
 * { jobs, pages, total, totalPages, loadedPages, failedPages, nextPageToLoad, isIncomplete }
 *
 * @param {object} [filters]
 * @returns {Promise<{
 *   jobs: Array<object>,
 *   pages: Record<number, Array<object>>,
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
      pages: { 1: normalized },
      total: filtered.length,
      totalPages: 1,
      loadedPages: [1],
      failedPages: [],
      nextPageToLoad: null,
      isIncomplete: false,
    };
  }

  // Backend supports sort=best_fit, page, and pageSize up to 50
  const page1Data = await request(jobsPath(1, filters));
  const firstPage = (Array.isArray(page1Data?.jobs) ? page1Data.jobs : []).map(normalizeJob);
  const totalPages = typeof page1Data?.totalPages === 'number' ? page1Data.totalPages : 1;
  const rest = await fetchMorePages(2, totalPages, MAX_PAGES_TO_FETCH - 1, filters);
  const pages = { 1: firstPage, ...rest.pages };
  const normalized = flattenJobPages(pages);
  const filtered = filters ? filterJobs(normalized, filters) : normalized;

  return {
    jobs: filtered,
    pages,
    total: filtered.length,
    totalPages,
    loadedPages: [1, ...rest.loadedPages],
    failedPages: rest.failedPages,
    nextPageToLoad: rest.nextPageToLoad,
    isIncomplete: rest.failedPages.length > 0 || rest.nextPageToLoad !== null,
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
  if (USE_MOCK_JOBS || jobId.startsWith('job-')) {
    const match = MOCK_JOBS.find((j) => j.id === jobId);
    if (match) return normalizeJob(match);
  }

  try {
    const res = await request(`/jobs/${encodeURIComponent(jobId)}`);
    if (!res || !res.job) {
      const fallback = MOCK_JOBS.find((j) => j.id === jobId);
      return fallback ? normalizeJob(fallback) : null;
    }

    return normalizeJob({
      ...res.job,
      match: res.match,
      application: res.application,
    });
  } catch (err) {
    const fallback = MOCK_JOBS.find((j) => j.id === jobId);
    if (fallback) return normalizeJob(fallback);
    throw err;
  }
}
