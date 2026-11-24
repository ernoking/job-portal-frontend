import test from 'node:test';
import assert from 'node:assert/strict';
import { getSavedJobs, saveJob, isJobSaved, toggleSaveJob } from '../src/api/savedJobs.js';

test('saved jobs are scoped by verified user ID and do not leak across users', () => {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };

  const userA = 'user-uuid-111';
  const userB = 'user-uuid-222';
  const job1 = { id: 'job-1', title: 'Product Designer' };
  const job2 = { id: 'job-2', title: 'Fullstack Dev' };

  // User A saves job 1
  saveJob(job1, userA);
  assert.equal(isJobSaved('job-1', userA), true);
  assert.equal(getSavedJobs(userA).length, 1);

  // User B has no saved jobs initially (isolated storage)
  assert.equal(isJobSaved('job-1', userB), false);
  assert.equal(getSavedJobs(userB).length, 0);

  // User B saves job 2
  saveJob(job2, userB);
  assert.equal(isJobSaved('job-2', userB), true);
  assert.equal(isJobSaved('job-2', userA), false);

  assert.deepEqual(getSavedJobs(userA).map(j => j.id), ['job-1']);
  assert.deepEqual(getSavedJobs(userB).map(j => j.id), ['job-2']);

  // User A toggles job 1 to remove it
  const isNowSaved = toggleSaveJob(job1, userA);
  assert.equal(isNowSaved, false);
  assert.equal(isJobSaved('job-1', userA), false);
  // User B's jobs remain intact
  assert.equal(isJobSaved('job-2', userB), true);
});
