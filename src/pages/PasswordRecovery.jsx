import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import Button from '../components/Button'
import { requestPasswordReset, resetPassword } from '../api/auth'
import { passwordErrors } from '../auth/passwordRecovery'
import { clearStoredSession } from '../auth/storage'
import { clearDraft } from '../onboarding/draftStore'
import './Login.css'
import './PasswordRecovery.css'

export default function PasswordRecovery({ recovery, resetting = false }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [invalid, setInvalid] = useState(resetting && !recovery?.get())
  const pending = useRef(false)

  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    const fields = resetting ? passwordErrors(password, confirmation) :
      (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.trim().length <= 254 ? {} : { email: 'Please enter a valid email address.' })
    setErrors(fields)
    if (Object.keys(fields).length) return
    const credentials = resetting ? recovery?.get() : null
    if (resetting && !credentials) { setInvalid(true); return }
    pending.current = true
    setBusy(true)
    setError('')
    try {
      if (resetting) {
        const result = await resetPassword({ ...credentials, password })
        recovery.clear()
        clearStoredSession()
        clearDraft()
        setPassword('')
        setConfirmation('')
        setMessage(result.sessionsRevoked === false
          ? 'Your password was updated, but signing out other sessions could not be confirmed. Log in with your new password.'
          : 'Your password has been updated. Log in with your new password.')
      } else {
        const result = await requestPasswordReset(email.trim())
        setMessage(result.message)
      }
      setDone(true)
    } catch (err) {
      if (resetting && (err.status === 401 || err.data?.error?.code === 'RECOVERY_LINK_INVALID')) {
        recovery.clear()
        setInvalid(true)
      } else setError(err.message || 'Unable to complete your request. Please try again.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return <>
    <title>{resetting ? 'Reset password' : 'Forgot password'} — Matchwise</title>
    <meta name="robots" content="noindex, nofollow" />
    <meta name="referrer" content="no-referrer" />
    <AuthLayout
      eyebrowText="ACCOUNT RECOVERY"
      headingText="Get back to your next opportunity."
      paragraphText="Securely reset your password to return to your workspace."
      leftFooterLabel="PRIVATE BY DESIGN"
      leftFooterRight="Your CV and account data are protected."
      pillText="SECURE RECOVERY"
      h1Content={resetting ? 'Set a new password' : 'Forgot your password?'}
      subContent={resetting ? 'Choose a password you haven’t used before.' : 'Enter your account email to receive a reset link.'}
    >
      {done ? <div className="recovery-result" role="status">
        <p>{message}</p>
        {!resetting && <p>The email may take a few minutes. If it doesn’t arrive, check spam or try again later.</p>}
        <Link className="switch-link" to="/login">Back to log in</Link>
      </div> : invalid ? <div className="recovery-result" role="alert">
        <p>This reset link is missing, invalid or expired. Request a new link to continue.</p>
        <Link className="switch-link" to="/forgot-password">Request a new reset link</Link>
      </div> : <form className="login-form recovery-form" onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy}>
          {resetting ? <>
            <Field id="new-password" name="password" label="New password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} hint="8–128 characters, including a number and a special character." />
            <Field id="confirm-password" name="confirmation" label="Confirm new password" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} error={errors.confirmPassword} />
          </> : <Field id="recovery-email" name="email" label="Email address" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} placeholder="you@example.com" />}
          <Button type="submit" fullWidth disabled={busy}>{busy ? (resetting ? 'Updating password…' : 'Sending reset link…') : (resetting ? 'Update password' : 'Send reset link')}</Button>
        </fieldset>
        {error && <div className="auth-form-error" role="alert">{error}</div>}
        <Link className="switch-link" to="/login">Back to log in</Link>
      </form>}
    </AuthLayout>
  </>
}
