import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import Field from '../components/Field'
import Checkbox from '../components/Checkbox'
import Button from '../components/Button'
import { registerUser } from '../api/auth'
import './Register.css'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    password: '',
    agreeTerms: false,
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Password: 8+ chars with number and special char
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>_~`\-+=\\[\]\\/])[a-zA-Z0-9!@#$%^&*(),.?":{}|<>_~`\-+=\\[\]\\/]{8,}$/
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = 'Must be 8+ chars with number & special character'
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms and Privacy Policy'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      // TODO(AJSP-23): confirm endpoint paths, request/response shape and session handling with the backend team
      await registerUser(formData)
      navigate('/upload')
    } catch (err) {
      setSubmitError(err.message || 'Unable to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Left interactive steps list
  const stepsList = (
    <div className="steps-container">
      {/* Connector lines behind badges */}
      <div className="steps-connector conn-1" aria-hidden="true" />
      <div className="steps-connector conn-2" aria-hidden="true" />

      {/* Row 1 */}
      <div className="step-row">
        <div className="step-badge">1</div>
        <div className="step-text">
          <span className="step-title">Upload your CV</span>
          <span className="step-sub">PDF or DOCX, securely stored</span>
        </div>
      </div>

      {/* Row 2 */}
      <div className="step-row">
        <div className="step-badge">2</div>
        <div className="step-text">
          <span className="step-title">Meet your AI profile</span>
          <span className="step-sub">Review skills and experience in minutes</span>
        </div>
      </div>

      {/* Row 3 */}
      <div className="step-row">
        <div className="step-badge">3</div>
        <div className="step-text">
          <span className="step-title">Discover your top matches</span>
          <span className="step-sub">Ranked opportunities with clear fit scores</span>
        </div>
      </div>
    </div>
  )

  return (
    <AuthLayout
      pageType="register"
      eyebrowText="A SMARTER START"
      headingText={<>Turn one CV into your<br />best next move.</>}
      paragraphText={<>Create your free account and let AI do the heavy lifting – from<br />understanding your experience to finding roles that truly fit.</>}
      leftFooterLabel="FREE TO GET STARTED"
      leftFooterRight="From sign-up to matches in under 5 minutes."
      leftCardContent={stepsList}
      pillText="START MATCHING TODAY"
      h1Content={<>Create your free<br />account</>}
      subContent={<>Upload your CV and see your strongest job matches in<br />minutes.</>}
    >
      <form onSubmit={handleSubmit} noValidate className="register-form">
        {/* Name row */}
        <div className="register-name-row">
          <div className="name-col">
            <Field
              label="First name"
              id="firstName"
              name="firstName"
              placeholder="Alex"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              autoComplete="given-name"
              required
            />
          </div>
          <div className="name-col">
            <Field
              label="Last name"
              id="lastName"
              name="lastName"
              placeholder="Morgan"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        {/* Middle name */}
        <div className="register-field-row">
          <Field
            label="Middle name (optional)"
            id="middleName"
            name="middleName"
            placeholder="Jordan"
            value={formData.middleName}
            onChange={handleChange}
            autoComplete="additional-name"
          />
        </div>

        {/* Email */}
        <div className="register-field-row">
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

        {/* Password */}
        <div className="register-field-row pass-field-row">
          <Field
            label="Password"
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            hint="Use 8+ characters with a number and special character"
            autoComplete="new-password"
            required
          />
        </div>

        {/* Checkbox Terms row with exact 6px gap items and detached period */}
        <div className="register-terms-row">
          <Checkbox
            id="agreeTerms"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            size={12}
          >
            <span className="terms-flex-wrap">
              <span>I agree to the</span>
              <a href="#terms" className="terms-link">Terms</a>
              <span>and</span>
              <a href="#privacy" className="terms-link">Privacy Policy</a>
              <span className="detached-period">.</span>
            </span>
          </Checkbox>
          {errors.agreeTerms && <span className="terms-error-msg">{errors.agreeTerms}</span>}
        </div>

        {/* Submit */}
        <div className="register-submit-wrap">
          <Button type="submit" variant="primary" fullWidth arrow disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </div>

        {submitError && (
          <div className="auth-form-error" role="alert">
            {submitError}
          </div>
        )}

        {/* Bottom switch */}
        <div className="register-bottom-switch">
          <span className="switch-text">Already have an account?</span>
          <Link to="/login" className="switch-link">
            Log in
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
