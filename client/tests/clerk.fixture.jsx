import { createContext, useContext, useEffect, useState } from 'react'

const Session = createContext(null)
const getToken = async () => 'test-session-token'
export function ClerkProvider({ children }) {
  const [isLoaded, setLoaded] = useState(false)
  const signedOut = localStorage.getItem('test-signed-out') === 'true'
  const member = localStorage.getItem('test-member') === 'true'
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), Number(localStorage.getItem('test-auth-delay') || 0))
    return () => clearTimeout(timer)
  }, [])
  return <Session.Provider value={{ isLoaded, user: signedOut ? null : { id: 'fixture-user', firstName: 'Student', publicMetadata: { role: member ? 'member' : 'admin' } } }}>{children}</Session.Provider>
}
export const useUser = () => useContext(Session)
export const useAuth = () => ({ getToken })
export function SignedIn({ children }) { const { user, isLoaded } = useUser(); return user && isLoaded ? children : null }
export function SignedOut({ children }) { const { user, isLoaded } = useUser(); return !user && isLoaded ? children : null }
export function UserButton() { return <button aria-label="Account" className="rounded-full bg-blue-100 px-3 py-2 text-blue-700">S</button> }
export function SignIn() { return <p>Sign in form</p> }
export function SignUp() { return <p>Create account form</p> }