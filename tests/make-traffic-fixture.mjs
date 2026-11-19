import { createApiTrafficMonitor } from '../src/monitoring/apiTraffic.js';
let mono = 0;
const monitor = createApiTrafficMonitor({
  enabled: true, endpoint: 'https://monitor.example/traffic',
  captureRequests: process.argv.includes('--requests'),
  now: () => mono, wallNow: () => 1_000_000 + mono,
  id: () => '12345678-1234-1234-1234-123456789abc',
  fetchImpl: async (url, options) => {
    if (url.startsWith('https:')) { process.stdout.write(options.body); return { status: 204 }; }
    mono += 350;
    return { status: 200, headers: new Headers({ 'X-Request-Id': '12345678-1234-4234-8234-123456789abc' }) };
  },
});
await monitor.fetch('/api/jobs/private-id?secret=discard-me');
await monitor.flush();
