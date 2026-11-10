import { request } from './http';

/**
 * Authenticates an existing user against the backend.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ token: string, expiresAt: number, user: object, success: boolean }>}
 */
export async function loginUser(credentials) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: credentials.email,
      password: credentials.password,
    },
  });
  return { ...data, success: true };
}

/**
 * Registers a new user account with the backend.
 *
 * @param {{ firstName: string, lastName: string, middleName?: string, email: string, password: string, agreeTerms: boolean }} userData
 * @returns {Promise<{ token: string, expiresAt: number, user: object, success: boolean }>}
 */
export async function registerUser(userData) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    body: userData,
  });
  return { ...data, success: true };
}

/**
 * Revokes the current session on the backend.
 *
 * @param {string} [token]
 * @returns {Promise<null>}
 */
export async function logoutUser(token) {
  return await request('/api/auth/logout', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

/**
 * Fetches the currently authenticated user from /api/me.
 *
 * @param {string} [token]
 * @returns {Promise<object>} The public user object
 */
export async function getCurrentUser(token) {
  const data = await request('/api/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data?.user ?? data;
}
