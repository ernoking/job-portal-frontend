import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import CareerPreferences from './pages/CareerPreferences'
import ProfileReview from './pages/ProfileReview'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/upload" element={<ResumeUpload />} />
      <Route path="/preferences" element={<CareerPreferences />} />
      <Route path="/profile/review" element={<ProfileReview />} />
      <Route path="/matches" element={<div style={{ padding: 40, fontFamily: 'sans-serif' }}>Matches Placeholder</div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
