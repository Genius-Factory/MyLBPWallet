import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, useUser } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import PropTypes from 'prop-types'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashBoardPage from './pages/DashBoardPage'
import AboutPage from './pages/AboutPage'
import AdminDashboard from './pages/AdminDashboard'

function AdminRoute({ children }) {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return null
  if (!user) return <Navigate to="/sign-in" replace />
  if (user.publicMetadata?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <div className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-10">
        <SignedIn>
          <Sidebar />
        </SignedIn>

        <main className="mx-auto min-h-[calc(100vh-4rem-160px)] w-full max-w-7xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/dashboard" element={<DashBoardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
}
