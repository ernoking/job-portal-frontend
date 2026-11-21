import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createApiTrafficMonitor, REPORT_INTERVAL_MS } from '../src/monitoring/apiTraffic.js';

function setup(extra = {}) {
  const posts = [];
  let mono = 0;
  let clock = 1_000_000;
  const monitor = createApiTrafficMonitor({
    enabled: true, endpoint: 'https://monitor.example/traffic',
    now: () => mono, wallNow: () => clock,
    fetchImpl: async (url, options) => {
      if (url === 'https://monitor.example/traffic') {
        posts.push({ options, batch: JSON.parse(options.body) });
        return { status: 204 };
      }
      mono += 350;
      return { status: 200 };
    }, ...extra,
  });
  return { monitor, posts, advance() { clock += 60_000; } };
}

test('opt-in and valid HTTPS endpoint are required; business fetch passes through', async () => {
  for (const config of [{ enabled: false }, { endpoint: '' }, { endpoint: 'http://monitor.example' },
    { endpoint: 'https://user:secret@monitor.example' }, { endpoint: 'https://monitor.example?q=secret' }]) {
    let calls = 0;
    const response = { status: 200 };
    const { monitor } = setup({ ...config, fetchImpl: async () => { calls += 1; return response; },
      setIntervalImpl: () => assert.fail('disabled timer') });
    monitor.start();
    assert.equal(await monitor.fetch('/api/jobs'), response);
    await monitor.flush();
    assert.equal(calls, 1);
  }
});

test('single 60-second timer; no immediate or stop/background send', () => {
  let scheduled = 0;
  let cleared = 0;
  const { monitor, posts } = setup({ setIntervalImpl: (_fn, ms) => {
    assert.equal(ms, 60_000); scheduled += 1; return 7;
  }, clearIntervalImpl: (value) => { assert.equal(value, 7); cleared += 1; } });
  assert.equal(REPORT_INTERVAL_MS, 60_000);
  monitor.start(); monitor.start();
  assert.equal(scheduled, 1);
  monitor.stop(); monitor.start();
  assert.equal(cleared, 1);
  assert.equal(scheduled, 1);
  assert.equal(posts.length, 0);
});

test('aggregates status, route groups, timing bins; strips IDs, queries, credentials and health', async () => {
  const { monitor, posts, advance } = setup();
  await monitor.fetch('/api/jobs/private-id?email=secret@example.test', {
    headers: { Authorization: 'Bearer password' }, body: 'private CV',
  });
  await monitor.fetch('/api/jobs/another-id?page=2');
  await monitor.fetch('/api/health');
  advance(); await monitor.flush();
  const { batch, options } = posts[0];
  assert.equal(batch.starts[0].count, 2);
  assert.equal(batch.results[0].route, 'jobs');
  assert.equal(batch.results[0].status, 200);
  assert.equal(batch.results[0].duration_sum_ms, 700);
  assert.equal(batch.results[0].duration_bins[2], 2);
  assert.equal(batch.results[0].duration_bins.reduce((a, b) => a + b), 2);
  for (const secret of ['private-id', 'another-id', 'secret@', 'password', 'private CV', 'Authorization']) {
    assert.equal(options.body.includes(secret), false);
  }
  assert.equal(options.credentials, 'omit');
  assert.equal(options.referrerPolicy, 'no-referrer');
  assert.equal(batch.timing, 'fetch_response_headers');
  assert.equal(batch.window_end_ms - batch.window_start_ms, 60_000);
});

test('network errors and aborts preserve original exceptions and have separate outcomes', async () => {
  for (const name of ['TypeError', 'AbortError']) {
    const error = new Error('private details'); error.name = name;
    const posts = [];
    const { monitor } = setup({ fetchImpl: async (url, options) => {
      if (url.startsWith('https:')) { posts.push(JSON.parse(options.body)); return { status: 204 }; }
      throw error;
    } });
    await assert.rejects(monitor.fetch('/api/auth/login', { method: 'POST' }), (caught) => caught === error);
    await monitor.flush();
    assert.equal(posts[0].results[0].outcome, name === 'AbortError' ? 'aborted' : 'network_error');
    assert.equal(JSON.stringify(posts).includes('private details'), false);
  }
});

test('bounded cardinality; excess result series are reported as lost observations', async () => {
  const posts = [];
  let status = 100;
  const { monitor } = setup({ fetchImpl: async (url, options) => {
    if (url.startsWith('https:')) { posts.push(JSON.parse(options.body)); return { status: 204 }; }
    return { status: status++ };
  } });
  for (let n = 0; n < 180; n += 1) await monitor.fetch(`/api/jobs/${n}`);
  await monitor.flush();
  assert.equal(posts[0].results.length, 128);
  assert.equal(posts[0].delivery.dropped_observations, 52);
  assert.equal(posts[0].starts[0].count, 180);
});

test('retry at subsequent ticks keeps batch identical, caps attempts, retains newer traffic', async () => {
  const posts = [];
  let fail = true;
  const { monitor } = setup({ fetchImpl: async (url, options) => {
    if (url.startsWith('https:')) {
      posts.push(options.body);
      if (fail) throw new Error('offline');
      return { status: 204 };
    }
    return { status: 200 };
  } });
  await monitor.fetch('/api/jobs');
  await monitor.flush();
  await monitor.fetch('/api/profile');
  await monitor.flush(); await monitor.flush();
  assert.equal(posts[0], posts[1]); assert.equal(posts[1], posts[2]);
  fail = false; await monitor.flush();
  const latest = JSON.parse(posts[3]);
  assert.notEqual(latest.batch_id, JSON.parse(posts[0]).batch_id);
  assert.equal(latest.starts[0].route, 'profile');
  assert.equal(latest.delivery.failed_attempts, 3);
  assert.equal(latest.delivery.dropped_batches, 1);
});

test('HTML 200 is not an acknowledgement; idle heartbeats have empty business counters', async () => {
  const posts = [];
  const { monitor } = setup({ fetchImpl: async (url, options) => {
    posts.push(JSON.parse(options.body)); return { status: 200 };
  } });
  await monitor.flush(); await monitor.flush();
  assert.deepEqual(posts[0].starts, []);
  assert.deepEqual(posts[0].results, []);
  assert.equal(posts[0].batch_id, posts[1].batch_id);
});

test('slow delivery does not overlap; requests finishing later appear in the next batch', async () => {
  let releaseBusiness, releasePost;
  const posts = [];
  const { monitor } = setup({ fetchImpl: (url, options) => {
    if (url.startsWith('https:')) {
      posts.push(JSON.parse(options.body));
      return new Promise((resolve) => { releasePost = () => resolve({ status: 204 }); });
    }
    return new Promise((resolve) => { releaseBusiness = () => resolve({ status: 204 }); });
  } });
  const business = monitor.fetch('/api/jobs');
  const delivery = monitor.flush();
  await monitor.flush();
  assert.equal(posts.length, 1);
  assert.equal(posts[0].inflight, 1);
  assert.equal(posts[0].results.length, 0);
  releaseBusiness(); await business;
  releasePost(); await delivery;
  const nextDelivery = monitor.flush();
  assert.equal(posts[1].results[0].status, 204);
  assert.equal(posts[1].inflight, 0);
  releasePost(); await nextDelivery;
});

test('delivery timeout cancels transport and releases the next scheduled attempt', async () => {
  let timeout;
  let sends = 0;
  const { monitor } = setup({
    setTimeoutImpl: (fn, ms) => { assert.equal(ms, 8000); timeout = fn; return 1; },
    clearTimeoutImpl: () => {},
    fetchImpl: (url, options) => {
      sends += 1;
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
      });
    },
  });
  const first = monitor.flush(); timeout(); await first;
  const second = monitor.flush(); timeout(); await second;
  assert.equal(sends, 2);
});

test('existing HTTP helper keeps JSON, 204, error and logout behaviour with instrumentation', async () => {
  let nextResponse;
  let networkError = false;
  let logouts = 0;
  const { monitor } = setup({ fetchImpl: async () => {
    if (networkError) throw new TypeError('offline');
    return nextResponse;
  } });
  globalThis.__trafficTest = { monitoredFetch: monitor.fetch,
    getStoredSession: () => ({ token: 'test-token' }), clearStoredSession: () => { logouts += 1; } };
  try {
    let source = await readFile(new URL('../src/api/http.js', import.meta.url), 'utf8');
    source = source.replace(/^import .*;\r?\n/gm, '');
    source = 'const { monitoredFetch, getStoredSession, clearStoredSession } = globalThis.__trafficTest;\n' + source;
    const { request, ApiError, setUnauthorizedHandler } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    setUnauthorizedHandler(() => {});
    nextResponse = new Response(null, { status: 204 });
    assert.equal(await request('/auth/logout'), null);
    nextResponse = Response.json({ jobs: [1] });
    assert.deepEqual(await request('/jobs'), { jobs: [1] });
    for (const status of [401, 404, 429, 500, 503]) {
      nextResponse = Response.json({ error: { message: 'expected' } }, { status });
      await assert.rejects(request('/jobs'), (e) => e instanceof ApiError && e.status === status);
    }
    assert.equal(logouts, 1);
    nextResponse = Response.json({}, { status: 401 });
    await assert.rejects(request('/auth/login', { method: 'POST' }));
    assert.equal(logouts, 1);
    networkError = true;
    await assert.rejects(request('/jobs'), (e) => e instanceof ApiError && e.status === 0);
  } finally { delete globalThis.__trafficTest; }
});

test('correlation stays opt-in and keeps the existing receiver contract by default', async () => {
  const { monitor, posts } = setup();
  await monitor.fetch('/api/jobs');
  await monitor.flush();
  assert.equal(posts[0].batch.schema_version, 1);
  assert.equal(Object.hasOwn(posts[0].batch, 'requests'), false);
  assert.equal(Object.hasOwn(posts[0].batch, 'dropped_requests'), false);
});

test('schema v2 records the response request ID, normalized endpoint and consistent timing', async () => {
  const requestId = '12345678-1234-4234-8234-123456789abc';
  const posts = [];
  let mono = 100;
  const response = new Response(null, { status: 503, headers: { 'X-Request-Id': requestId.toUpperCase() } });
  const { monitor } = setup({
    captureRequests: true, now: () => mono, wallNow: () => 1_000_000,
    fetchImpl: async (url, options) => {
      if (url.startsWith('https:')) { posts.push(JSON.parse(options.body)); return { status: 204 }; }
      mono += 1200;
      return response;
    },
  });
  assert.equal(await monitor.fetch('/api/cv/private-file-id/profile?email=private@example.test', {
    method: 'POST', headers: { Authorization: 'Bearer private-token' }, body: 'private CV',
  }), response);
  await monitor.flush();
  assert.equal(posts[0].schema_version, 2);
  assert.equal(posts[0].timing, 'fetch_response_headers');
  assert.deepEqual(posts[0].requests, [{
    request_id: requestId, started_at_ms: 1_000_000, finished_at_ms: 1_001_200,
    duration_ms: 1200, route: '/cv/:id/profile', method: 'POST', status: 503, outcome: 'http',
  }]);
  assert.equal(posts[0].results[0].duration_sum_ms, posts[0].requests[0].duration_ms);
  assert.equal(posts[0].dropped_requests, 0);
  for (const secret of ['private-file-id', 'private@example.test', 'private-token', 'private CV']) {
    assert.equal(JSON.stringify(posts).includes(secret), false);
  }
});

test('missing or malformed response IDs stay uncorrelated and never leak header contents', async () => {
  for (const header of [null, 'private-invalid-value', 'x'.repeat(1000)]) {
    const { monitor, posts } = setup({
      captureRequests: true,
      fetchImpl: async (url, options) => {
        if (url.startsWith('https:')) { posts.push({ batch: JSON.parse(options.body) }); return { status: 204 }; }
        return { status: 502, headers: { get: () => header } };
      },
    });
    await monitor.fetch('/api/jobs/private-job-id');
    await monitor.flush();
    assert.equal(posts[0].batch.requests[0].request_id, null);
    assert.equal(posts[0].batch.requests[0].route, '/jobs/:id');
    assert.equal(posts[0].batch.requests[0].status, 502);
    assert.equal(JSON.stringify(posts).includes('private-invalid-value'), false);
    assert.equal(JSON.stringify(posts).includes('private-job-id'), false);
  }
});

test('network errors and cancellations retain their outcome with a null request ID', async () => {
  for (const name of ['TypeError', 'AbortError', 'TimeoutError']) {
    const error = new Error('private details'); error.name = name;
    const { monitor, posts } = setup({
      captureRequests: true,
      fetchImpl: async (url, options) => {
        if (url.startsWith('https:')) { posts.push({ batch: JSON.parse(options.body) }); return { status: 204 }; }
        throw error;
      },
    });
    await assert.rejects(monitor.fetch('/api/auth/login', { method: 'POST' }), e => e === error);
    await monitor.flush();
    const record = posts[0].batch.requests[0];
    assert.equal(record.request_id, null);
    assert.equal(record.status, 0);
    assert.equal(record.outcome, name === 'TypeError' ? 'network_error' : 'aborted');
    assert.equal(JSON.stringify(record).includes('private details'), false);
  }
});

test('request records are bounded without dropping aggregate counts', async () => {
  const { monitor, posts } = setup({ captureRequests: true });
  for (let n = 0; n < 100; n++) await monitor.fetch('/api/jobs/' + n);
  await monitor.flush();
  const batch = posts[0].batch;
  assert.equal(batch.requests.length, 64);
  assert.equal(batch.dropped_requests, 36);
  assert.equal(batch.starts[0].count, 100);
  assert.equal(batch.results[0].count, 100);
  assert.ok(new TextEncoder().encode(posts[0].options.body).byteLength < 60_000);
});

test('v2 retries keep request records identical and isolate newer traffic', async () => {
  const posts = [];
  let fail = true;
  const { monitor } = setup({ captureRequests: true, fetchImpl: async (url, options) => {
    if (url.startsWith('https:')) {
      posts.push(options.body);
      if (fail) throw new Error('offline');
      return { status: 204 };
    }
    return new Response(null, { status: 200 });
  } });
  await monitor.fetch('/api/jobs');
  await monitor.flush();
  await monitor.fetch('/api/account');
  await monitor.flush();
  assert.equal(posts[0], posts[1]);
  fail = false;
  await monitor.flush();
  await monitor.flush();
  assert.equal(JSON.parse(posts[3]).requests[0].route, '/account');
  assert.notEqual(JSON.parse(posts[0]).batch_id, JSON.parse(posts[3]).batch_id);
});

test('health requests stay excluded and unknown endpoints are redacted in v2', async () => {
  const { monitor, posts } = setup({ captureRequests: true });
  await monitor.fetch('/api/health');
  await monitor.fetch('/health');
  await monitor.fetch('/api/private-person@example.test/secret?q=private-query');
  await monitor.flush();
  const batch = posts[0].batch;
  assert.equal(batch.requests.length, 1);
  assert.equal(batch.requests[0].route, 'unmatched');
  assert.equal(JSON.stringify(batch).includes('private-person'), false);
  assert.equal(JSON.stringify(batch).includes('private-query'), false);
});

test('an in-flight request finishing after a reporting boundary retains its original start time', async () => {
  let release;
  let mono = 0;
  let wall = 1_000_000;
  const posts = [];
  const { monitor } = setup({
    captureRequests: true, now: () => mono, wallNow: () => wall,
    fetchImpl: (url, options) => {
      if (url.startsWith('https:')) { posts.push(JSON.parse(options.body)); return Promise.resolve({ status: 204 }); }
      return new Promise(resolve => { release = resolve; });
    },
  });
  const request = monitor.fetch('/api/cv/synthetic-id/profile', { method: 'POST' });
  wall += 60_000; mono += 60_000;
  await monitor.flush();
  assert.deepEqual(posts[0].requests, []);
  wall += 1000; mono += 1000;
  release(new Response(null, { status: 200 }));
  await request;
  await monitor.flush();
  const record = posts[1].requests[0];
  assert.equal(record.started_at_ms, 1_000_000);
  assert.equal(record.finished_at_ms, 1_061_000);
  assert.equal(record.duration_ms, 61_000);
  assert.ok(record.started_at_ms < posts[1].window_start_ms);
});
