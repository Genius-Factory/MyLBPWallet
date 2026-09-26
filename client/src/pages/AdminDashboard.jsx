import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react'
import { useApi } from '../hooks/useApi'

export default function AdminDashboard() {
  const api = useApi()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingUserId, setSavingUserId] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/api/users')
      setUsers(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const updateRole = async (userId, role) => {
    setSavingUserId(userId)
    setError('')

    try {
      await api.put(`/api/users/${userId}/role`, { role })
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === userId ? { ...user, role } : user)),
      )
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update user role.')
    } finally {
      setSavingUserId('')
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase text-blue-600">
            <ShieldCheck size={16} />
            Administration
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage account roles and access.</p>
        </div>
        <button type="button" onClick={loadUsers} disabled={loading} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-500 sm:px-6">
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 sm:px-6">Username</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-500">No users found.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 sm:px-6">{user.username || 'Unnamed user'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <select value={user.role || 'member'} onChange={(event) => updateRole(user.id, event.target.value)} disabled={savingUserId === user.id} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 disabled:opacity-50" aria-label={`Role for ${user.username || user.email}`}>
                      <option value="member">Member</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
