// Versioned, bounded telemetry. Routes are templates; URLs and credentials stay local.
export const REPORT_INTERVAL_MS = 60_000;
export const DURATION_LIMITS_MS = [100, 250, 500, 1000, 2500, 5000, 10000, 30000, 60000];
const METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const GROUPS = new Set(['auth', 'jobs', 'cv', 'profile', 'preferences', 'me']);
const MAX_RESULTS = 128;
const MAX_ATTEMPTS = 3;
const MAX_REQUESTS = 64;
const REQUEST_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const REQUEST_ROUTES = new Map([
  ['/api/auth/register', '/auth/register'], ['/api/auth/login', '/auth/login'],
  ['/api/auth/logout', '/auth/logout'], ['/api/me', '/me'], ['/api/account', '/account'],
  ['/api/cv', '/cv'], ['/api/cv/upload', '/cv/upload'], ['/api/profile', '/profile'],
  ['/api/jobs', '/jobs'], ['/api/preferences', '/preferences'], ['/api/ai/usage', '/ai/usage'],
]);

function requestRoute(input) {
  const path = String(input).split(/[?#]/, 1)[0];
  const fixed = REQUEST_ROUTES.get(path);
  if (fixed) return fixed;
  if (/^\/api\/cv\/[^/]+\/download$/.test(path)) return '/cv/:id/download';
  if (/^\/api\/cv\/[^/]+\/profile$/.test(path)) return '/cv/:id/profile';
  if (/^\/api\/jobs\/[^/]+$/.test(path)) return '/jobs/:id';
  return 'unmatched';
}

function dimensions(input, method) {
  const path = String(input).split(/[?#]/, 1)[0];
  if (path === '/api/health' || path === '/health') return null;
  const segment = path.startsWith('/api/') ? path.slice(5).split('/')[0] : '';
  const verb = String(method || 'GET').toUpperCase();
  return { route: GROUPS.has(segment) ? segment : 'other', method: METHODS.has(verb) ? verb : 'OTHER' };
}

export function createApiTrafficMonitor({
  enabled = false, endpoint = '', baseUrl = 'https://www.matchwise.tech/',
  fetchImpl = (...args) => globalThis.fetch(...args),
  now = () => performance.now(), wallNow = () => Date.now(),
  setIntervalImpl = setInterval, clearIntervalImpl = clearInterval,
  setTimeoutImpl = setTimeout, clearTimeoutImpl = clearTimeout,
  id = () => globalThis.crypto.randomUUID(),
  mockApi = false, mockJobs = false,
  captureRequests = false,
} = {}) {
  let target = null;
  try {
    const candidate = new URL(endpoint, baseUrl);
    if (enabled && endpoint && candidate.protocol === 'https:' &&
        !candidate.username && !candidate.password && !candidate.search && !candidate.hash) target = candidate.href;
  } catch { /* Missing or invalid configuration disables reporting. */ }
  const diagnostics = { sent_batches: 0, failed_attempts: 0, dropped_batches: 0, dropped_observations: 0 };
  const empty = () => ({ start: wallNow(), starts: new Map(), results: new Map(), requests: [], droppedRequests: 0 });
  let active = empty();
  let pending = null;
  let timer = null;
  let sending = false;
  let inflight = 0;
  let stopped = false;
  const safe = (fn) => { try { return fn(); } catch { return undefined; } };

  function recordRequest(input, dim, status, outcome, elapsed, startedAt, response) {
    if (!captureRequests) return;
    if (active.requests.length >= MAX_REQUESTS) { active.droppedRequests += 1; return; }
    if (!Number.isFinite(elapsed) || !Number.isSafeInteger(startedAt)) {
      active.droppedRequests += 1;
      return;
    }
    const duration = Math.max(0, Math.min(elapsed, 3_600_000));
    const rawId = safe(() => response?.headers?.get('X-Request-Id'));
    const requestId = typeof rawId === 'string' && REQUEST_ID.test(rawId) ? rawId.toLowerCase() : null;
    active.requests.push({
      request_id: requestId,
      started_at_ms: startedAt,
      finished_at_ms: Math.round(startedAt + duration),
      duration_ms: duration,
      route: requestRoute(input),
      method: dim.method,
      status,
      outcome,
    });
  }

  function record(dim, status, outcome, elapsed) {
    const key = `${dim.route}:${dim.method}:${outcome}:${status}`;
    let row = active.results.get(key);
    if (!row) {
      if (active.results.size >= MAX_RESULTS) { diagnostics.dropped_observations += 1; return; }
      row = { ...dim, status, outcome, count: 0, duration_sum_ms: 0, duration_max_ms: 0,
        duration_bins: Array(DURATION_LIMITS_MS.length + 1).fill(0) };
      active.results.set(key, row);
    }
    const duration = Number.isFinite(elapsed) ? Math.max(0, Math.min(elapsed, 3_600_000)) : 0;
    row.count += 1;
    row.duration_sum_ms += duration;
    row.duration_max_ms = Math.max(row.duration_max_ms, duration);
    const bin = DURATION_LIMITS_MS.findIndex((bound) => duration <= bound);
    row.duration_bins[bin < 0 ? DURATION_LIMITS_MS.length : bin] += 1;
  }

  // Measures fetch until response headers, not body download/JSON parsing or server-only latency.
  async function measuredFetch(input, options = {}) {
    if (!target || stopped) return fetchImpl(input, options);
    const dim = safe(() => dimensions(input, options.method));
    if (!dim) return fetchImpl(input, options);
    const began = safe(now);
    const startedAt = captureRequests ? safe(wallNow) : null;
    safe(() => {
      const key = `${dim.route}:${dim.method}`;
      const row = active.starts.get(key) || { ...dim, count: 0 };
      row.count += 1;
      active.starts.set(key, row);
      inflight += 1;
    });
    try {
      const response = await fetchImpl(input, options);
      const status = response.status >= 100 && response.status <= 599 ? response.status : 'other';
      const elapsed = safe(() => now() - began);
      safe(() => record(dim, status, 'http', elapsed));
      safe(() => recordRequest(input, dim, status, 'http', elapsed, startedAt, response));
      return response;
    } catch (error) {
      const outcome = ['AbortError', 'TimeoutError'].includes(error?.name) ? 'aborted' : 'network_error';
      const elapsed = safe(() => now() - began);
      safe(() => record(dim, 0, outcome, elapsed));
      safe(() => recordRequest(input, dim, 0, outcome, elapsed, startedAt));
      throw error;
    } finally {
      safe(() => { inflight = Math.max(0, inflight - 1); });
    }
  }

  async function flush() {
    if (!target || stopped || sending) return;
    sending = true;
    let timeout;
    try {
      if (!pending) {
        const batch = {
          schema_version: captureRequests ? 2 : 1, batch_id: id(), window_start_ms: active.start, window_end_ms: wallNow(),
          interval_ms: REPORT_INTERVAL_MS, timing: 'fetch_response_headers',
          mock_api: Boolean(mockApi), mock_jobs: Boolean(mockJobs), inflight,
          duration_limits_ms: DURATION_LIMITS_MS,
          starts: [...active.starts.values()], results: [...active.results.values()],
          delivery: { ...diagnostics },
          ...(captureRequests ? { requests: active.requests, dropped_requests: active.droppedRequests } : {}),
        };
        pending = { body: JSON.stringify(batch), attempts: 0 };
        active = empty();
      }
      pending.attempts += 1;
      if (new TextEncoder().encode(pending.body).byteLength > 60_000) {
        diagnostics.dropped_batches += 1; pending = null; return;
      }
      const controller = new AbortController();
      timeout = setTimeoutImpl(() => controller.abort(), 8000);
      // Direct transport avoids measuring telemetry as business API traffic.
      const response = await fetchImpl(target, {
        method: 'POST', body: pending.body, headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
        redirect: 'error', cache: 'no-store', signal: controller.signal,
      });
      // A 204 is the receiver acknowledgement. A generic HTML 200 is not delivery success.
      if (response.status !== 204) throw new Error('Telemetry not acknowledged');
      diagnostics.sent_batches += 1;
      pending = null;
    } catch {
      diagnostics.failed_attempts += 1;
      if (pending && pending.attempts >= MAX_ATTEMPTS) {
        diagnostics.dropped_batches += 1;
        pending = null;
      }
    } finally {
      if (timeout !== undefined) clearTimeoutImpl(timeout);
      sending = false;
    }
  }

  return {
    fetch: measuredFetch,
    start() {
      if (target && timer === null && !stopped) timer = setIntervalImpl(() => { void flush(); }, REPORT_INTERVAL_MS);
    },
    stop() {
      stopped = true;
      if (timer !== null) clearIntervalImpl(timer);
      timer = null;
    },
    // Explicit flush is for tests/manual diagnostics; production only uses the 60-second timer.
    flush,
  };
}
