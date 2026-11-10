import { getStoredSession, clearStoredSession } from '../auth/storage';

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.body = data;
    this.fields = data?.error?.fields || null;
  }
}

let unauthorizedHandler = null;

/**
 * Registers a callback invoked when a 401 Unauthorized status is returned
 * on an authenticated request (excluding login and register).
 *
 * @param {Function|null} handler
 */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function handleUnauthorized() {
  clearStoredSession();
  if (typeof unauthorizedHandler === 'function') {
    unauthorizedHandler();
  } else if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

/**
 * Shared request helper for real-mode and authenticated HTTP calls.
 * Prepends /api if missing, injects Authorization header if token exists,
 * handles JSON serialization/parsing, network errors, 503, and 401 auto-logout.
 *
 * @param {string} path - e.g. '/api/auth/login' or '/profile'
 * @param {RequestInit} [options={}]
 * @returns {Promise<any>}
 */
export async function request(path, options = {}) {
  const url = path.startsWith('/api')
    ? path
    : `/api${path.startsWith('/') ? '' : '/'}${path}`;

  const headers = { ...options.headers };

  // Add auth header from stored session when present and not explicitly provided
  if (!headers.Authorization && !headers.authorization) {
    const session = getStoredSession();
    if (session?.token) {
      headers.Authorization = `Bearer ${session.token}`;
    }
  }

  let body = options.body;
  if (
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob)
  ) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    body = JSON.stringify(body);
  }
  headers.Accept = headers.Accept || 'application/json';

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      body,
    });
  } catch {
    throw new ApiError(
      "We can't reach the server. Check your connection and try again.",
      0,
      null
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return null;
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 503) {
      throw new ApiError(
        'The service is unavailable right now. Please try again later.',
        503,
        data
      );
    }

    if (
      res.status === 502 ||
      res.status === 504 ||
      (typeof data === 'string' && data.includes('ECONNREFUSED'))
    ) {
      throw new ApiError(
        "We can't reach the server. Check your connection and try again.",
        res.status,
        data
      );
    }

    const isLoginOrRegister = url.includes('/auth/login') || url.includes('/auth/register');
    if (res.status === 401 && !isLoginOrRegister) {
      handleUnauthorized();
      const message = data?.error?.message || 'Session expired or invalid. Please log in again.';
      throw new ApiError(message, 401, data);
    }

    let serverMessage =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      data?.message ||
      null;

    if (!serverMessage) {
      serverMessage = 'Something went wrong. Please try again.';
    }

    throw new ApiError(serverMessage, res.status, data);
  }

  return data;
}

// Re-export apiFetch for backward compatibility
export const apiFetch = request;
