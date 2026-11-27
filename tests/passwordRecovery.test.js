import test from 'node:test'
import assert from 'node:assert/strict'
import { captureRecovery, passwordErrors } from '../src/auth/passwordRecovery.js'
import { requestPasswordReset, resetPassword } from '../src/api/auth.js'
import { setUnauthorizedHandler } from '../src/api/http.js'

test('recovery captures credentials once in memory and removes secrets and query from history', () => {
  const calls = []
  const state = captureRecovery({ pathname: '/reset-password', hash: '#access_token=private-jwt&refresh_token=private-refresh&type=recovery' }, { state: { key: 'route' }, replaceState: (...args) => calls.push(args) })
  assert.deepEqual(state.get(), { accessToken: 'private-jwt', refreshToken: 'private-refresh' })
  assert.deepEqual(calls, [[{ key: 'route' }, '', '/reset-password']])
  assert.deepEqual(state.get(), state.get()) // StrictMode renders do not consume it.
  state.clear(); assert.equal(state.get(), null)
})
test('missing, wrong-flow and expired links never produce usable recovery credentials', () => {
  for (const hash of ['', '#access_token=jwt&type=recovery', '#access_token=jwt&refresh_token=r&type=signup', '#error=access_denied&error_code=otp_expired']) {
    const state = captureRecovery({ pathname: '/reset-password', hash }, { replaceState() {} })
    assert.equal(state.get(), null); assert.equal(state.linkError, true)
  }
  let replaced = false
  captureRecovery({ pathname: '/login', hash: '#anything' }, { replaceState() { replaced = true } })
  assert.equal(replaced, false)
})
test('new password validation covers policy, length and mismatch', () => {
  assert.deepEqual(passwordErrors('Password#123', 'Password#123'), {})
  assert.ok(passwordErrors('weak', 'weak').password)
  assert.ok(passwordErrors('Password#123', 'different').confirmPassword)
  assert.ok(passwordErrors('a'.repeat(129) + '#1', 'same').password)
})
test('recovery API sends secrets in body/header only and expired links do not trigger login redirect', async () => {
  const original = globalThis.fetch; const calls = []; let redirected = false
  setUnauthorizedHandler(() => { redirected = true })
  globalThis.fetch = async (url, opts) => {
    calls.push({ url, opts })
    return { ok: url.endsWith('forgot-password'), status: url.endsWith('forgot-password') ? 202 : 401, headers: { get: () => 'application/json' }, json: async () => url.endsWith('forgot-password') ? { message: 'Check your email' } : { error: { message: 'Invalid link' } } }
  }
  try {
    await requestPasswordReset('candidate@example.test')
    await assert.rejects(resetPassword({ accessToken: 'private-jwt', refreshToken: 'private-refresh', password: 'New#12345' }), { status: 401 })
    assert.equal(calls[1].url, '/api/auth/reset-password')
    assert.equal(calls[1].opts.headers.Authorization, 'Bearer private-jwt')
    assert.deepEqual(JSON.parse(calls[1].opts.body), { refreshToken: 'private-refresh', password: 'New#12345' })
    assert.equal(redirected, false)
  } finally { globalThis.fetch = original; setUnauthorizedHandler(null) }
})
