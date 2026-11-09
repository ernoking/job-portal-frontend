// Public configuration flag (not a secret).
// Mock mode is the default because the backend has no endpoints for CV upload, preferences and profile yet.
// To try real mode, start Vite with VITE_USE_MOCK_API=false.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';
