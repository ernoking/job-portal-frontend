import { createApiTrafficMonitor } from './apiTraffic.js';
import { trafficConfig } from './trafficConfig.js';

const env = import.meta.env;
const monitor = createApiTrafficMonitor({
  enabled: env.VITE_FRONTEND_TELEMETRY_ENABLED === undefined
    ? trafficConfig.enabled : env.VITE_FRONTEND_TELEMETRY_ENABLED === 'true',
  endpoint: env.VITE_FRONTEND_TELEMETRY_URL ?? trafficConfig.endpoint,
  baseUrl: window.location.href,
  mockApi: env.VITE_USE_MOCK_API === 'true',
  mockJobs: env.VITE_USE_MOCK_JOBS === 'true',
  captureRequests: env.VITE_FRONTEND_TELEMETRY_REQUESTS_ENABLED === undefined
    ? trafficConfig.captureRequests : env.VITE_FRONTEND_TELEMETRY_REQUESTS_ENABLED === 'true',
});

export const monitoredFetch = monitor.fetch;
export function startApiTraffic() { monitor.start(); }

if (import.meta.hot) import.meta.hot.dispose(() => monitor.stop());
