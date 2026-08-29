import { useState } from 'react'
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
import WalletPage from './pages/WalletPage'
import DatabasePage from './pages/DatabasePage'

function AdminRoute({ children }) {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return null
  if (!user) return <Navigate to="/sign-in" replace />
  if (user.publicMetadata?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentExpenses, setCurrentExpenses] = useState({ lbp: '', usd: '' })
  const [categoryWallet, setCategoryWallet] = useState({
    electricity: { value: '', usd: '', price: 7.88 },
    water: { value: '', usd: '', price: 400000 },
    fuel: { value: '', usd: '', price: 2455000 },
    groceries: { value: '', usd: '', price: 895000 },
  })
  const [monthlyBudget, setMonthlyBudget] = useState('')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <div
        className={`flex-1 w-full px-4 py-6 transition-[padding] duration-200 sm:px-6 lg:pr-10 ${
          sidebarCollapsed ? 'md:pl-28' : 'md:pl-64'
        }`}
      >
        <SignedIn>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((value) => !value)}
          />
        </SignedIn>

        <main className="mx-auto min-h-[calc(100vh-4rem-160px)] w-full max-w-7xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route
              path="/wallet"
              element={
                <WalletPage
                  currentExpenses={currentExpenses}
                  categoryWallet={categoryWallet}
                  monthlyBudget={monthlyBudget}
                  setMonthlyBudget={setMonthlyBudget}
                />
              }
            />
            <Route
              path="/admin-dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/database"
              element={
                <SignedIn>
                  <DatabasePage />
                </SignedIn>
              }
            />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route
              path="/dashboard"
              element={
                <DashBoardPage
                  setCurrentExpenses={setCurrentExpenses}
                  setCategoryWallet={setCategoryWallet}
                />
              }
            />
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
