import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteAccount } from '../src/api/auth.js';

test('deleteAccount calls DELETE /api/account with password in JSON body and auth header', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];

  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return {
      status: 204,
      ok: true,
      headers: {
        get(header) {
          if (header.toLowerCase() === 'content-type') return null;
          return null;
        },
      },
    };
  };

  try {
    const password = 'SecretPassword123!';
    const token = 'sample-auth-jwt-token';

    const result = await deleteAccount(password, token);

    assert.equal(requests.length, 1);
    const [req] = requests;
    assert.equal(req.url, '/api/account');
    assert.equal(req.options.method, 'DELETE');
    assert.equal(req.options.headers.Authorization, `Bearer ${token}`);
    assert.equal(req.options.headers['Content-Type'], 'application/json');

    const parsedBody = JSON.parse(req.options.body);
    assert.deepEqual(parsedBody, { password: 'SecretPassword123!' });
    assert.equal(result, null); // 204 No Content parses to null
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deleteAccount throws ApiError on wrong password (401)', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    status: 401,
    ok: false,
    headers: {
      get(header) {
        if (header.toLowerCase() === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => ({
      error: { code: 'WRONG_PASSWORD', message: 'That password is not correct.' },
    }),
  });

  try {
    await assert.rejects(
      async () => {
        await deleteAccount('WrongPassword', 'token');
      },
      (err) => {
        assert.equal(err.status, 401);
        assert.equal(err.message, 'That password is not correct.');
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('deleteAccount throws ApiError on server failure (503)', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => ({
    status: 503,
    ok: false,
    headers: {
      get(header) {
        if (header.toLowerCase() === 'content-type') return 'application/json';
        return null;
      },
    },
    json: async () => ({
      error: { code: 'ACCOUNT_DELETE_FAILED', message: 'Unable to delete your account right now.' },
    }),
  });

  try {
    await assert.rejects(
      async () => {
        await deleteAccount('Password123', 'token');
      },
      (err) => {
        assert.equal(err.status, 503);
        assert.equal(err.message, 'Unable to delete your account right now.');
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
