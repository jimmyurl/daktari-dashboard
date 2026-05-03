import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import PatientsPage from './pages/PatientsPage'
import DoctorsPage from './pages/DoctorsPage'
import AppointmentsPage from './pages/AppointmentsPage'
import AdminsPage from './pages/AdminsPage'
import SetupPage from './pages/SetupPage'
import RevenuePage from './pages/RevenuePage'

function ProtectedRoute({ children }) {
  const { admin } = useAuth()

  // Still loading from localStorage
  if (admin === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-100 border-t-green-700
            rounded-full animate-spin"/>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!admin) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { admin } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        admin && admin !== undefined
          ? <Navigate to="/" replace />
          : <LoginPage />
      }/>
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index                  element={<Dashboard />} />
        <Route path="patients"        element={<PatientsPage />} />
        <Route path="doctors"         element={<DoctorsPage />} />
        <Route path="appointments"    element={<AppointmentsPage />} />
        <Route path="revenue"         element={<RevenuePage />} />
        <Route path="admins"          element={<AdminsPage />} />
        <Route path="setup"           element={<SetupPage />} />
      </Route>
    </Routes>
  )
}