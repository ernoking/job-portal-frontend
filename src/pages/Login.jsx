import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'
import { CheckIcon } from '../components/Icons'
import { loginUser } from '../api/auth'
import { useAuth } from '../auth'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    const newErrors = {}

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {

      const sessionData = await loginUser(formData)
      signIn(sessionData, formData.rememberMe)
      // TODO: if the user already confirmed a profile, go to /matches
      const destination = location.state?.from?.pathname || location.state?.from || '/upload'
      navigate(destination, { replace: true })

    } catch (err) {
      if (err.status === 401) {
        setSubmitError('Incorrect email or password.')
      } else if (err.status === 400 && (err.fields || err.body?.error?.fields)) {
        setErrors((prev) => ({
          ...prev,
          ...(err.fields || err.body?.error?.fields),
        }))
      } else {
        setSubmitError(err.message || 'Unable to log in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Left card component: "Your opportunity hub"
  const opportunityHubCard = (
    <div className="hub-card">
      {/* 1. Header row */}
      <div className="hub-header">
        <div className="hub-avatar">M</div>
        <div className="hub-title-col">
          <span className="hub-title">Your opportunity hub</span>
          <span className="hub-updated">Updated moments ago</span>
        </div>
        <div className="hub-status-ring">
          <span className="hub-status-dot" />
        </div>
      </div>

      <div className="hub-divider" />

      {/* 2. Stats row */}
      <div className="hub-stats">
        <div className="hub-stat-col">
          <span className="hub-stat-num">24</span>
          <span className="hub-stat-label">NEW MATCHES</span>
        </div>
        <div className="hub-stat-sep" />
        <div className="hub-stat-col">
          <span className="hub-stat-num">3</span>
          <span className="hub-stat-label">ACTIVE APPLICATIONS</span>
        </div>
        <div className="hub-stat-sep" />
        <div className="hub-stat-col">
          <span className="hub-stat-num">92%</span>
          <span className="hub-stat-label">BEST FIT</span>
        </div>
      </div>

      {/* 3. Ready strip */}
      <div className="hub-ready-strip">
        <div className="hub-check-box">
          <CheckIcon size={16} stroke={3} color="#17332A" />
        </div>
        <div className="hub-ready-text">
          <span className="hub-ready-title">Your profile is match-ready</span>
          <span className="hub-ready-sub">18 skills mapped from your CV</span>
        </div>
      </div>
    </div>
  )

  return (
    <AuthLayout
      pageType="login"
      eyebrowText="YOUR WORKSPACE IS READY"
      headingText={<>Pick up right where you<br />left off.</>}
      paragraphText={<>Your latest matches, saved roles, and application progress are waiting in<br />one focused place.</>}
      leftFooterLabel="PRIVATE BY DESIGN"
      leftFooterRight="Your CV and account data are protected."
      leftCardContent={opportunityHubCard}
      pillText="WELCOME BACK"
      h1Content="Log in to your account"
      subContent="Your next opportunity might already be waiting."
    >
      <form onSubmit={handleSubmit} noValidate className="login-form">
        <div className="login-field-row">
          <Field
            label="Email address"
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            required
          />
        </div>

        <div className="login-field-row">
          <Field
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="login-actions-row">
          <Checkbox
            id="rememberMe"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            size={13}
          >
            Remember me
          </Checkbox>
          <a href="#forgot" className="forgot-password-link">
            Forgot password?
          </a>
        </div>

        <div className="login-submit-wrap">
          <Button type="submit" variant="primary" fullWidth arrow disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </Button>
        </div>

        {submitError && (
          <div className="auth-form-error" role="alert" data-testid="login-error">
            {submitError}
          </div>
        )}

        <div className="login-bottom-switch">
          <span className="switch-text">New to Matchwise?</span>
          <Link to="/register" className="switch-link">
            Create an account
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
