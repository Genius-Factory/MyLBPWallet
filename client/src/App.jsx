import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashBoardPage from './pages/DashBoardPage'
import AboutPage from './pages/AboutPage'

function Footer() {
  return (
    <footer className="mt-auto py-5 text-center text-sm text-gray-400">
      Made with{' '}
      <span className="inline-block text-red-500 animate-pulse">♥</span>
      {' '}by{' '}
      <span className="font-semibold text-gray-500">Genius Factory</span>
      {' '}© 2026
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <SignedIn>
          <Sidebar />
        </SignedIn>
        <main className="min-h-[calc(100vh-4rem-160px)]">
          <Routes>
            {/* Public — visible to everyone */}
            <Route path="/" element={<HomePage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/dashboard" element={<DashBoardPage />} />
            <Route path="/about" element={<DashBoardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  )
}
