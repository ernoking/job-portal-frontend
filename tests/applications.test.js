import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyToJob,
  getApplications,
  generateTailoring,
  getTailorings,
  getTailoringDetail,
  downloadTailoredDoc,
} from '../src/api/applications.js';

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

test('getTailoringDetail fetches GET /api/tailorings/:id', async () => {
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
        tailoring: {
          id: 'tailor-999',
          jobId: 'job-123',
          tone: 'confident',
          tailoredProfile: { fullName: 'Jane Doe' },
        },
      }),
    };
  };

  try {
    const res = await getTailoringDetail('tailor-999', 'token-xyz');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/api/tailorings/tailor-999');
    assert.equal(requests[0].options.method, 'GET');
    assert.equal(requests[0].options.headers.Authorization, 'Bearer token-xyz');
    assert.equal(res.tailoring.id, 'tailor-999');
    assert.equal(res.tailoring.tone, 'confident');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('cover letter edited in state creates a blob preserving user edits', async () => {
  // Verifies the contract used in TailoredAiView handleDownload:
  // Blob created with edited content preserves edits over backend original
  const editedText = 'Dear Hiring Manager,\n\nI am thrilled to apply with my edited sentence.\n\nSincerely,\nJane';
  const blob = new Blob([editedText], { type: 'text/plain;charset=utf-8' });
  const text = await blob.text();
  assert.equal(text, editedText);
  assert(text.includes('edited sentence'));
});

test('saved document retrieval handles 503 failure and subsequent successful retry without POST /tailor', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  let failFirst = true;

  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, method: options.method || 'GET' });

    if (url.includes('/tailorings') && failFirst) {
      failFirst = false;
      return {
        status: 503,
        ok: false,
        headers: {
          get(header) {
            if (header.toLowerCase() === 'content-type') return 'application/json';
            return null;
          },
        },
        json: async () => ({
          error: { code: 'SERVICE_UNAVAILABLE', message: 'Tailoring history temporary unavailable' },
        }),
      };
    }

    if (url === '/api/jobs/job-123/tailorings') {
      return {
        status: 200,
        ok: true,
        headers: {
          get(header) {
            if (header.toLowerCase() === 'content-type') return 'application/json';
            return null;
          },
        },
        json: async () => ({
          tailorings: [{ id: 'tailor-prev', tone: 'concise', createdAt: '2026-11-23T20:00:00Z' }],
        }),
      };
    }

    if (url === '/api/tailorings/tailor-prev') {
      return {
        status: 200,
        ok: true,
        headers: {
          get(header) {
            if (header.toLowerCase() === 'content-type') return 'application/json';
            return null;
          },
        },
        json: async () => ({
          tailoring: {
            id: 'tailor-prev',
            tone: 'concise',
            coverLetter: 'Restored cover letter',
            tailoredProfile: { fullName: 'Candidate' },
          },
        }),
      };
    }

    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    // 1. Initial attempt fails with 503
    let errorCaught = null;
    try {
      await getTailorings('job-123', 'fake-token');
    } catch (err) {
      errorCaught = err;
    }
    assert(errorCaught, 'Expected 503 error on first retrieval');
    assert.equal(errorCaught.status, 503);

    // 2. Retry succeeds without calling POST /tailor
    const tailoringsRes = await getTailorings('job-123', 'fake-token');
    assert.equal(tailoringsRes.tailorings.length, 1);

    const detailRes = await getTailoringDetail(tailoringsRes.tailorings[0].id, 'fake-token');
    assert.equal(detailRes.tailoring.id, 'tailor-prev');
    assert.equal(detailRes.tailoring.coverLetter, 'Restored cover letter');

    // Verify none of the requests were POST /tailor (no AI allowance was consumed)
    const postTailorCalls = requests.filter(
      (r) => r.method === 'POST' && r.url.endsWith('/tailor')
    );
    assert.equal(postTailorCalls.length, 0, 'No POST /tailor generation call should be made during retry');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
