/**
 * Helper for real mode HTTP requests.
 * Throws friendly user-facing errors on network or server failures.
 */
export async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    throw new Error("We can't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    let serverMessage = null;
    try {
      const data = await res.json();
      if (data && typeof data === 'object') {
        serverMessage = data.error?.message || (typeof data.error === 'string' ? data.error : null) || data.message || null;
      }
    } catch {
      // Body is not JSON or empty
    }

    if (serverMessage) {
      throw new Error(serverMessage);
    }

    if (res.status === 503) {
      throw new Error('The service is unavailable right now. Please try again later.');
    }

    throw new Error('Something went wrong. Please try again.');
  }

  // Handle empty responses or 204 No Content
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await res.json();
  }
  return null;
}
