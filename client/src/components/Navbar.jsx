import { Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import { Wallet } from 'lucide-react'

export default function Navbar() {
  const { user } = useUser()
  return (
    <header className="border-b border-slate-200 bg-white">
      <a href="#main" className="sr-only focus:not-sr-only focus:block focus:p-3">Skip to content</a>
      <nav aria-label="Main navigation" className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3 font-bold tracking-tight">
          <span className="rounded-xl bg-blue-600 p-2.5 text-white"><Wallet size={21} aria-hidden="true" /></span>
          <span>MyLBP<span className="font-normal text-slate-500">Wallet</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <SignedIn>
            <Link className="text-sm font-medium text-slate-600 hover:text-blue-700" to="/dashboard">Tracker</Link>
            {user?.publicMetadata?.role === 'admin' && (
              <details className="relative">
                <summary className="cursor-pointer text-sm text-slate-600">Admin</summary>
                <div className="absolute right-0 z-20 mt-3 grid w-44 gap-1 rounded-xl border bg-white p-2 shadow-lg">
                  <Link className="rounded-lg p-2 text-sm hover:bg-slate-50" to="/admin-dashboard">Manage users</Link>
                  <Link className="rounded-lg p-2 text-sm hover:bg-slate-50" to="/database">View database</Link>
                </div>
              </details>
            )}
            <UserButton />
          </SignedIn>
          <SignedOut><Link to="/sign-in" className="btn-primary">Sign in</Link></SignedOut>
        </div>
      </nav>
    </header>
  )
}