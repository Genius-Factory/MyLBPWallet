import { useRef, useState } from 'react'
import { Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useWallet } from '../hooks/useWallet'
import { apiError } from '../lib/api'
import { beirutDate, money, monthLabel } from '../lib/format'
import TransactionForm from '../components/TransactionForm'
import BudgetPanel from '../components/BudgetPanel'
import TransactionHistory from '../components/TransactionHistory'

export default function DashBoardPage() {
  const [month, setMonth] = useState(() => beirutDate().slice(0, 7))
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const deleting = useRef(false)
  const { api, data, loading, error, refresh } = useWallet(month, type, page)

  const changeMonth = value => {
    if (!/^\d{4}-\d{2}$/.test(value) || value < '1900-01') return
    setMonth(value); setPage(1); setEditing(null); setDeleteError('')
  }
  const saved = transactionMonth => {
    setEditing(null); setPage(1); setType('all')
    if (transactionMonth !== month) setMonth(transactionMonth)
    refresh()
    toast.success('Transaction saved')
  }
  const remove = async id => {
    if (deleting.current) return false
    deleting.current = true
    setBusy(true); setDeleteError('')
    try {
      await api.delete(`/api/transactions/${id}`)
      if (editing?.id === id) setEditing(null)
      if (data.transactions.length === 1 && page > 1) setPage(page - 1)
      refresh(); toast.success('Transaction deleted')
      return true
    } catch (err) { setDeleteError(apiError(err)); return false }
    finally { deleting.current = false; setBusy(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Your monthly tracker</p><h1 className="mt-2 text-3xl font-bold tracking-tight">A clearer view of your money.</h1><p className="mt-2 text-sm text-slate-500">Income, expenses, and a little room to plan ahead.</p></div>
        <label className="label shrink-0">Viewing month<input aria-label="Viewing month" className="field" type="month" min="1900-01" max="9999-12" value={month} disabled={busy} onChange={e => changeMonth(e.target.value)} /></label>
      </div>

      {loading && <div className="card py-8 text-center text-slate-500" role="status">Loading {monthLabel(month)}…</div>}
      {error && <div className="error-box flex flex-wrap items-center justify-between gap-3" role="alert"><span>{error}</span><button className="btn-secondary" onClick={refresh}>Try again</button></div>}
      {data && <>
        {data.totals.excludedCount > 0 && <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">{data.totals.excludedCount} legacy entries cannot be converted and are excluded from these totals. Review the marked entries in history.</p>}
        <article aria-labelledby="wallet-balance-label" className="relative isolate w-full max-w-md overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-slate-200 via-slate-100 to-white p-7 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full border-[32px] border-white/40" />
          <div className="flex items-center justify-between gap-4">
            <h2 id="wallet-balance-label" className="text-sm font-medium text-slate-600">Balance</h2>
            <Wallet size={28} className="text-blue-600" aria-hidden="true" />
          </div>
          <p className={`mt-10 break-all text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${Number(data.totals.balance) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{money(data.totals.balance)}</p>
        </article>
      </>}
      <div className="grid items-stretch gap-6 lg:grid-cols-[1.6fr_1fr]">
        <TransactionForm key={`${month}-${editing?.id || 'new'}`} api={api} month={month} editing={editing} rate={data?.rate} onSaved={saved} onCancel={() => setEditing(null)} onBusy={setBusy} busy={busy} />
        {data ? <BudgetPanel key={`${month}-${data.budget?.amount}-${data.budget?.currency}`} api={api} month={month} budget={data.budget} expenses={data.totals.expenses} onSaved={() => { refresh(); toast.success('Budget saved') }} onBusy={setBusy} busy={busy} />
          : <section className="card"><h2 className="text-lg font-semibold">Monthly budget</h2><p className="mt-3 text-sm text-slate-500">{loading ? 'Loading your budget…' : 'Retry loading your wallet to view or update the budget.'}</p></section>}
      </div>
      {deleteError && <p className="error-box" role="alert">{deleteError}</p>}
      {data && <TransactionHistory data={data} type={type} page={page} busy={busy} onType={value => { setType(value); setPage(1) }} onPage={setPage} onEdit={item => { setEditing(item); document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); requestAnimationFrame(() => document.getElementById('entry-title-input')?.focus()) }} onDelete={remove} />}
      <p className="pb-3 text-center text-xs leading-5 text-slate-400">Monthly totals include all income and expenses, regardless of the history filter.<br />Dates follow the Asia/Beirut calendar. Conversion uses saved configured rates, not live market rates.</p>
    </div>
  )
}