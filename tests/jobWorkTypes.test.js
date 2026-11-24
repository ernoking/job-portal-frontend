import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeJob, filterJobs, getMatches, fetchMorePages, retryFailedPages } from '../src/api/jobs.js';

test('work arrangements render readable labels and unknown jobs do not bypass selections', () => {
  const jobs = ['remote', 'hybrid', 'on_site', 'unknown', undefined].map((workType, id) => normalizeJob({ id, workType }));
  assert.deepEqual(jobs.map(j => j.workType), ['Remote', 'Hybrid', 'On-site', '', '']);
  assert.deepEqual(filterJobs(jobs, { workTypes: ['On-site'] }).map(j => j.id), [2]);
  assert.deepEqual(filterJobs(jobs, { workTypes: ['Remote', 'Hybrid'] }).map(j => j.id), [0, 1]);
  assert.equal(filterJobs(jobs, { workTypes: [] }).length, 5);
  assert.equal(filterJobs(jobs, { workTypes: ['Remote'], location: 'Debrecen' }).length, 0);
});

test('all catalogue pages, later loads and failed-page retries retain the server arrangement filter', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(new URL(url, 'https://test.invalid'));
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ jobs: [{ id: urls.length, workType: 'on_site' }], totalPages: 7 }) };
  };
  try {
    const filters = { workTypes: ['On-site', 'Hybrid'] };
    const initial = await getMatches(filters);
    assert.deepEqual(initial.loadedPages, [1, 2, 3, 4, 5]);
    assert.equal(initial.nextPageToLoad, 6);
    await fetchMorePages(6, 7, undefined, filters);
    await retryFailedPages([3], filters);
    assert.equal(urls.length, 8);
    for (const url of urls) assert.equal(url.searchParams.get('workType'), 'on_site,hybrid');
    urls.length = 0;
    await getMatches({ workTypes: [] });
    assert.ok(urls.every(url => !url.searchParams.has('workType')));
  } finally { globalThis.fetch = originalFetch; }
});
