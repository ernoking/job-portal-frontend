import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeJob, filterJobs, getMatches, fetchMorePages, retryFailedPages, canonicalSeniority } from '../src/api/jobs.js';

test('work arrangements render readable labels and unknown jobs do not bypass selections', () => {
  const jobs = ['remote', 'hybrid', 'on_site', 'unknown', undefined].map((workType, id) => normalizeJob({ id, workType }));
  assert.deepEqual(jobs.map(j => j.workType), ['Remote', 'Hybrid', 'On-site', '', '']);
  assert.deepEqual(filterJobs(jobs, { workTypes: ['On-site'] }).map(j => j.id), [2]);
  assert.deepEqual(filterJobs(jobs, { workTypes: ['Remote', 'Hybrid'] }).map(j => j.id), [0, 1]);
  assert.equal(filterJobs(jobs, { workTypes: [] }).length, 5);
  assert.equal(filterJobs(jobs, { workTypes: ['Remote'], location: 'Debrecen' }).length, 0);
});

test('canonicalSeniority maps levels properly and filterJobs filters jobs by seniority', () => {
  assert.equal(canonicalSeniority('Internship'), 'intern');
  assert.equal(canonicalSeniority('Junior'), 'junior');
  assert.equal(canonicalSeniority('Mid'), 'mid');
  assert.equal(canonicalSeniority('Mid-level'), 'mid');
  assert.equal(canonicalSeniority('Senior'), 'senior');
  assert.equal(canonicalSeniority('Lead'), 'lead');

  const jobs = [
    { id: 1, title: 'Intern', seniority: 'intern' },
    { id: 2, title: 'Junior Dev', seniority: 'junior' },
    { id: 3, title: 'Mid Designer', seniority: 'mid' },
    { id: 4, title: 'Senior Architect', seniority: 'senior' },
    { id: 5, title: 'Tech Lead', seniority: 'lead' },
  ].map(normalizeJob);

  assert.deepEqual(filterJobs(jobs, { seniorityLevels: ['Senior'] }).map(j => j.id), [4]);
  assert.deepEqual(filterJobs(jobs, { seniorityLevels: ['Junior', 'Mid'] }).map(j => j.id), [2, 3]);
  assert.equal(filterJobs(jobs, { seniorityLevels: [] }).length, 5);
});

test('all catalogue pages, later loads and failed-page retries retain the server arrangement and seniority filters', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(new URL(url, 'https://test.invalid'));
    return { ok: true, status: 200, headers: { get: () => 'application/json' }, json: async () => ({ jobs: [{ id: urls.length, workType: 'on_site', seniority: 'senior' }], totalPages: 7 }) };
  };
  try {
    const filters = { workTypes: ['On-site', 'Hybrid'], seniorityLevels: ['Senior', 'Lead'] };
    const initial = await getMatches(filters);
    assert.deepEqual(initial.loadedPages, [1, 2, 3, 4, 5]);
    assert.equal(initial.nextPageToLoad, 6);
    await fetchMorePages(6, 7, undefined, filters);
    await retryFailedPages([3], filters);
    assert.equal(urls.length, 8);
    for (const url of urls) {
      assert.equal(url.searchParams.get('workType'), 'on_site,hybrid');
      assert.equal(url.searchParams.get('seniority'), 'senior,lead');
    }
    urls.length = 0;
    await getMatches({ workTypes: [], seniorityLevels: [] });
    assert.ok(urls.every(url => !url.searchParams.has('workType') && !url.searchParams.has('seniority')));
  } finally { globalThis.fetch = originalFetch; }
});

test('filterJobs ranks jobs by fit score descending and filters unscored roles when minMatch > 0', () => {
  const jobs = [
    { id: 'job-unscored', title: 'Consultant', fit: null },
    { id: 'job-60', title: 'Developer', fit: 60 },
    { id: 'job-92', title: 'Architect', fit: 92 },
    { id: 'job-84', title: 'Lead', fit: 84 },
  ];

  // Default / 0% minMatch: ranked by score descending, unscored at end
  const defaultRanked = filterJobs(jobs, { minMatch: 0 });
  assert.deepEqual(defaultRanked.map(j => j.id), ['job-92', 'job-84', 'job-60', 'job-unscored']);
  assert.equal(defaultRanked[0].id, 'job-92'); // Highest match is Top Match

  // Without filters argument: also ranked by score descending
  const noFiltersRanked = filterJobs(jobs);
  assert.deepEqual(noFiltersRanked.map(j => j.id), ['job-92', 'job-84', 'job-60', 'job-unscored']);

  // 80% and above: excludes job-60 and job-unscored
  const filtered80 = filterJobs(jobs, { minMatch: 80 });
  assert.deepEqual(filtered80.map(j => j.id), ['job-92', 'job-84']);
  assert.equal(filtered80[0].id, 'job-92');

  // 50% and above: includes 60%, 84%, 92% sorted descending, excludes unscored
  const filtered50 = filterJobs(jobs, { minMatch: 50 });
  assert.deepEqual(filtered50.map(j => j.id), ['job-92', 'job-84', 'job-60']);
  assert.equal(filtered50[0].id, 'job-92');

  // 95% and above: no jobs qualify
  const filtered95 = filterJobs(jobs, { minMatch: 95 });
  assert.deepEqual(filtered95, []);
});

