# Job Portal Frontend

React + Vite frontend for Matchwise, the Software Engineering AI-powered job portal. Includes landing, login, and registration screens with client-side validation. Authentication currently uses simulated responses pending backend integration.

## Setup

Use Node.js 24 (`nvm use` if installed) and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Start the sibling `job-portal-backend` separately. During development, Vite proxies `/api` requests to http://localhost:3000; `fetch('/api/health')` reaches the backend health endpoint. Production hosting must configure the `/api` reverse proxy separately.

## Commands

- `npm run dev`: development server.
- `npm run lint`: Oxlint checks supplied by the Vite starter.
- `npm run build`: production bundle in `dist/`.
- `npm run preview`: preview the built bundle locally.

## Project boundaries

Sprint 1 targets registration/login, CV upload and AI-generated profile review. Later MVP work includes job search/filtering and explained match rankings. Keep AI calls and database operations in the backend. Never put private keys in `VITE_*` variables: those values are public in the browser bundle.

The product vision asks for responsive screens at 375 px and 1440 px. When implementing stories, include loading, empty and failure states and obtain confirmation before saving an AI-generated profile (FR-09/FR-11).

## Team workflow

Create a branch per story, reference its US/FR identifier in the PR, run lint and build, then request review before merging to `main`. The course materials remain in the parent course folder, outside this repository.

## Frontend/backend request correlation

The existing telemetry uses schema v1. After the monitoring receiver supports
schema v2, set `VITE_FRONTEND_TELEMETRY_REQUESTS_ENABLED=true` and rebuild the
frontend. The existing `VITE_FRONTEND_TELEMETRY_ENABLED` and
`VITE_FRONTEND_TELEMETRY_URL` settings still control delivery to the same endpoint.
The equivalent source setting is `trafficConfig.captureRequests`. Its default is
false, so the currently deployed v1 receiver remains compatible.

Schema v2 retains the existing aggregate fields and adds `requests` and
`dropped_requests`. Each request record looks like this:

```json
{
  "request_id": "12345678-1234-4234-8234-123456789abc",
  "started_at_ms": 1795075200000,
  "finished_at_ms": 1795075201200,
  "duration_ms": 1200,
  "route": "/cv/:id/profile",
  "method": "POST",
  "status": 503,
  "outcome": "http"
}
```

`request_id` comes from the backend's `X-Request-Id` response header and matches
`reqId` in the backend log. Missing or invalid IDs are null. Network errors and
aborts also have a null ID, status 0, and outcome `network_error` or `aborted`.
HTTP responses retain their status (or `other` for an invalid status).

Routes are templates matching backend router paths, with the `/api` prefix and
resource IDs removed. Unknown routes become `unmatched`. Health checks are
excluded. Request bodies, credentials, query strings and error messages are
excluded from telemetry.

Timing remains `fetch_response_headers`: duration uses a monotonic clock and
ends when headers arrive. Timestamps are epoch milliseconds anchored to the
browser's start clock; `finished_at_ms` is start plus measured duration, rounded
to milliseconds. The records support request matching without depending on
frontend and backend clocks being perfectly synchronized.

Delivery remains every 60 seconds. Records appear in the batch in which they
finish, so a long request can start before that batch's `window_start_ms`.
Each batch holds at most 64 request records, with overflow counted in
`dropped_requests`; aggregate counts still include those requests. Retries send
the identical batch. The receiver must deduplicate by `batch_id` before storing
request records and accept both schema versions during rollout. Store the
request ID as a log field for joining with backend `reqId`.

Generate a synthetic schema-v2 payload for receiver testing with
`node tests/make-traffic-fixture.mjs --requests`. Omitting `--requests` generates
the existing v1 fixture. Run `npm run test:telemetry` for the regression suite.
