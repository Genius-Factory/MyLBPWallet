import { Fragment } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashBoardPage from './pages/DashBoardPage'
import AdminDashboard from './pages/AdminDashboard'
import DatabasePage from './pages/DatabasePage'

function Protected({ children, admin = false }) {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return <p role="status" className="py-16 text-center text-slate-500">Loading your account…</p>
  if (!user) return <Navigate to="/sign-in" replace />
  if (admin && user.publicMetadata?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Fragment key={user.id}>{children}</Fragment>
}

function Home() {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return <p role="status">Loading your account…</p>
  return user ? <Navigate to="/dashboard" replace /> : <HomePage />
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Toaster position="top-right" />
      <Navbar />
      <main id="main" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Protected><DashBoardPage /></Protected>} />
          <Route path="/wallet" element={<Navigate to="/dashboard" replace />} />
          <Route path="/admin-dashboard" element={<Protected admin><AdminDashboard /></Protected>} />
          <Route path="/database" element={<Protected admin><DatabasePage /></Protected>} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/about" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
