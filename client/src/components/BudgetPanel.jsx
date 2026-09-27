import { useRef, useState } from 'react'
import { Target } from 'lucide-react'
import { apiError } from '../lib/api'
import { money, remainingBudget } from '../lib/format'

export default function BudgetPanel({ api, month, budget, expenses, onSaved, onBusy, busy }) {
  const compatible = !budget || budget.currency === 'USD'
  const [amount, setAmount] = useState(compatible ? budget?.amount ?? '' : '')
  const [editing, setEditing] = useState(!budget || !compatible)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  const remaining = budget && compatible ? remainingBudget(budget.amount, expenses) : null
  const percentage = budget && Number(budget.amount) > 0 ? Math.min(100, Number(expenses) / Number(budget.amount) * 100) : 0

  const save = async event => {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setSaving(true)
    onBusy(true)
    setError('')
    try {
      await api.put('/api/transactions/budget', { month, amount })
      setEditing(false)
      onSaved()
    } catch (err) { setError(apiError(err)) }
    finally { lock.current = false; setSaving(false); onBusy(false) }
  }

  return (
    <section className="card flex h-full flex-col" aria-labelledby="budget-title">
      <div className="flex items-center gap-2"><Target size={19} className="text-blue-600" aria-hidden="true" /><h2 id="budget-title" className="text-lg font-semibold">Monthly budget</h2></div>
      <p className="mt-2 text-sm leading-6 text-slate-500">A spending limit to help you stay on track.</p>
      {!compatible && <p role="alert" className="error-box mt-4">Your saved budget is in {budget.currency}. Enter a USD budget to replace it; no automatic conversion has been applied.</p>}
      {budget && compatible && <>
        <p className="mt-7 text-sm text-slate-500">{Number(remaining) < 0 ? 'Over budget' : 'Remaining this month'}</p>
        <p className={`mt-2 text-3xl font-semibold tracking-tight ${Number(remaining) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{money(Math.abs(Number(remaining)))}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Budget used" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full ${Number(remaining) < 0 ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${percentage}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-500">{money(expenses)} spent of {money(budget.amount)}</p>
      </>}
      {!budget && <div className="my-7 rounded-xl border border-dashed border-slate-200 p-5 text-sm leading-6 text-slate-500">Choose a budget for this month. Your remaining amount will update as you add expenses.</div>}
      {editing ? <form onSubmit={save} className="mt-auto pt-6">
        <label className="label">Budget (USD)<input className="field" required type="number" inputMode="decimal" min="0" max="999999999999.99" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 500" disabled={saving || busy} /></label>
        {error && <p role="alert" className="error-box mt-3">{error}</p>}
        <div className="mt-3 flex gap-2"><button className="btn-primary" disabled={saving || busy}>{saving ? 'Saving…' : 'Save budget'}</button>
          {budget && compatible && <button type="button" className="btn-secondary" disabled={saving || busy} onClick={() => { setEditing(false); setAmount(budget.amount); setError('') }}>Cancel</button>}</div>
      </form> : <button type="button" disabled={busy} onClick={() => setEditing(true)} className="btn-secondary mt-6 self-start">Edit budget</button>}
    </section>
  )
}