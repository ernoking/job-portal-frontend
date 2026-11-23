import test from 'node:test';
import assert from 'node:assert/strict';
import { applyToJob, getApplications, generateTailoring, downloadTailoredDoc } from '../src/api/applications.js';

test('applyToJob sends POST /api/jobs/:id/apply with Bearer token', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      status: 201,
      ok: true,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({
        application: { id: 'app-1', jobId: 'job-123', status: 'applied', method: 'manual' },
        applyUrl: 'https://example.com/careers/apply',
      }),
    };
  };

  try {
    const res = await applyToJob('job-123', 'fake-jwt-token');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/jobs/job-123/apply');
    assert.equal(requests[0].options.method, 'POST');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer fake-jwt-token');
    assert.equal(res.applyUrl, 'https://example.com/careers/apply');
    assert.equal(res.application.status, 'applied');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getApplications fetches GET /api/applications with query params', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      status: 200,
      ok: true,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({
        applications: [{ id: 'app-1', jobId: 'job-123', status: 'applied' }],
        total: 1,
      }),
    };
  };

  try {
    const res = await getApplications({ from: '2026-11-01', to: '2026-11-23' }, 'fake-jwt-token');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/applications?from=2026-11-01&to=2026-11-23');
    assert.equal(requests[0].options.method, 'GET');
    assert.equal(res.total, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('generateTailoring sends POST /api/jobs/:id/tailor with tone', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      status: 201,
      ok: true,
      headers: {
        get: (h) => (h.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: async () => ({
        tailoring: { id: 'tailor-1', tone: 'concise', coverLetter: 'Hello team...' },
        usage: { dailyUsed: 1 },
      }),
    };
  };

  try {
    const res = await generateTailoring('job-456', { tone: 'concise' }, 'token-xyz');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/jobs/job-456/tailor');
    assert.equal(requests[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(requests[0].options.body), { tone: 'concise' });
    assert.equal(res.tailoring.tone, 'concise');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('downloadTailoredDoc fetches document endpoint and returns blob', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      status: 200,
      ok: true,
      blob: async () => new Blob(['Alex Morgan Resume Content'], { type: 'text/plain' }),
    };
  };

  try {
    const blob = await downloadTailoredDoc('tailor-1', 'resume', 'token-abc');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/tailorings/tailor-1/resume');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer token-abc');
    assert(blob instanceof Blob);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
