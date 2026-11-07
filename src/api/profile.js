import { mockProfile } from '../mocks/profile';

// TODO(AJSP-5): confirm endpoints, JSON shape and parse-error format with the backend team (AJSP-56, AJSP-57)

export async function getProfile() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch {
    // Until backend endpoint is ready, simulate network delay and return mock data
    await new Promise((resolve) => setTimeout(resolve, 300));
    return structuredClone(mockProfile);
  }
}

export async function confirmProfile(profile) {
  try {
    const res = await fetch('/api/profile/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch {
    // Until backend endpoint is ready, simulate success after delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    return { success: true };
  }
}
