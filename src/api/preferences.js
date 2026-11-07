import { mockPreferences } from '../mocks/preferences';

// TODO(AJSP-5): confirm endpoints, request/response shape, file upload format (multipart) and error format with the backend team

export async function getPreferences() {
  try {
    const res = await fetch('/api/preferences');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch {
    // Until backend endpoint is ready, simulate network delay and return mock data
    await new Promise((resolve) => setTimeout(resolve, 300));
    return structuredClone(mockPreferences);
  }
}

export async function savePreferences(preferences) {
  try {
    const res = await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch {
    // Until backend endpoint is ready, simulate network delay and return success
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true };
  }
}
