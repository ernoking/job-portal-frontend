import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import PasswordRecovery from './pages/PasswordRecovery'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import CareerPreferences from './pages/CareerPreferences'
import ProfileReview from './pages/ProfileReview'
import ReviewCareerGoals from './pages/ReviewCareerGoals'
import JobsFeed from './pages/JobsFeed'
import ApplicationTracker from './pages/ApplicationTracker'
import ProfileSettings from './pages/ProfileSettings'
import StandardApplyView from './pages/StandardApplyView'
import TailoredAiView from './pages/TailoredAiView'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <>
        <meta name="robots" content="noindex, nofollow" />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            color: 'var(--muted)',
            backgroundColor: 'var(--page)',
          }}
        >
          Loading...
        </div>
      </>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      {children}
    </>
  )
}

export default function App({ recovery }) {
  const { pathname } = useLocation()
  // Recovery must work even when an unrelated stored login has expired.
  // Do not restore that login or redirect away while handling a reset link.
  if (pathname === '/forgot-password' || pathname === '/reset-password') {
    return <PasswordRecovery key={pathname} resetting={pathname === '/reset-password'} recovery={recovery} />
  }
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <ResumeUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/preferences"
          element={
            <ProtectedRoute>
              <CareerPreferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/review"
          element={
            <ProtectedRoute>
              <ProfileReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/goals"
          element={
            <ProtectedRoute>
              <ReviewCareerGoals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <JobsFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/apply"
          element={
            <ProtectedRoute>
              <StandardApplyView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/tailor"
          element={
            <ProtectedRoute>
              <TailoredAiView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <ApplicationTracker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
