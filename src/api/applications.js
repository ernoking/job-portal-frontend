import { request } from './http.js';

/**
 * Submits a manual application for a job.
 * Contract: POST /api/jobs/:id/apply
 *
 * @param {string} jobId
 * @param {string} [token]
 * @returns {Promise<{ application: { id: string, jobId: string, status: string, method: string, appliedAt: string }, applyUrl: string | null }>}
 */
export async function applyToJob(jobId, token) {
  return await request(`/api/jobs/${encodeURIComponent(jobId)}/apply`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * Fetches the user's application history.
 * Contract: GET /api/applications?from=&to=
 *
 * @param {{ from?: string, to?: string }} [filters]
 * @param {string} [token]
 * @returns {Promise<{ applications: Array<{ id: string, status: string, method: string, appliedAt: string, job: object }>, total: number }>}
 */
export async function getApplications(filters = {}, token) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await request(`/api/applications${query}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * Generates an AI tailoring document for a specific job.
 * Contract: POST /api/jobs/:id/tailor with { tone }
 *
 * @param {string} jobId
 * @param {{ tone?: 'professional' | 'friendly' | 'concise' }} [options]
 * @param {string} [token]
 * @returns {Promise<{ tailoring: object, usage: object }>}
 */
export async function generateTailoring(jobId, options = {}, token) {
  return await request(`/api/jobs/${encodeURIComponent(jobId)}/tailor`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: { tone: options.tone || 'professional' },
  });
}

/**
 * Lists recent tailoring versions for a job (limit: 20).
 * Contract: GET /api/jobs/:id/tailorings
 *
 * @param {string} jobId
 * @param {string} [token]
 * @returns {Promise<{ tailorings: Array<object>, total: number, limit: number }>}
 */
export async function getTailorings(jobId, token) {
  return await request(`/api/jobs/${encodeURIComponent(jobId)}/tailorings`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * Downloads a tailored document (resume or cover letter) as plain text UTF-8 blob.
 * Contract: GET /api/tailorings/:id/resume or /api/tailorings/:id/cover-letter
 *
 * @param {string} tailoringId
 * @param {'resume' | 'cover-letter'} type
 * @param {string} [token]
 * @returns {Promise<Blob>}
 */
export async function downloadTailoredDoc(tailoringId, type, token) {
  const url = `/api/tailorings/${encodeURIComponent(tailoringId)}/${type}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${type}: ${response.statusText}`);
  }

  return await response.blob();
}
