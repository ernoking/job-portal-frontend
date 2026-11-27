// Capture once before React/telemetry starts, then remove secrets from browser history.
// The object is memory-only and shared across StrictMode renders; reload requires a new link.
export function captureRecovery(location, history) {
  let credentials = null
  let linkError = false
  if (location.pathname === '/reset-password') {
    const params = new URLSearchParams(location.hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (params.get('type') === 'recovery' && accessToken && refreshToken && !params.has('error')) {
      credentials = { accessToken, refreshToken }
    } else linkError = true
    history.replaceState(history.state, '', location.pathname)
  }
  return { get: () => credentials, clear: () => { credentials = null }, linkError }
}

export function passwordErrors(password, confirmPassword) {
  const errors = {}
  if (typeof password !== 'string' || password.length > 128 || !/^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
    errors.password = 'Use 8–128 characters with a number and a special character.'
  }
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.'
  return errors
}
