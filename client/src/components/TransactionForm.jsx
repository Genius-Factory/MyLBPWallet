import { useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { apiError } from '../lib/api'
import { beirutDate, money } from '../lib/format'

export default function TransactionForm({ api, month, editing, rate, onSaved, onCancel, onBusy, busy }) {
  const today = beirutDate()
  const [form, setForm] = useState(editing || {
    type: 'expense', title: '', amount: '', currency: 'LBP',
    date: today.startsWith(month) ? today : `${month}-01`, notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const lock = useRef(false)
  const update = (name, value) => setForm(current => ({ ...current, [name]: value }))
  const save = async event => {
    event.preventDefault()
    if (lock.current) return
    lock.current = true
    setSaving(true)
    onBusy(true)
    setError('')
    try {
      if (editing) await api.put(`/api/transactions/${editing.id}`, form)
      else await api.post('/api/transactions', form)
      onSaved(form.date.slice(0, 7))
      if (!editing) setForm(current => ({ ...current, title: '', amount: '', notes: '' }))
    } catch (err) { setError(apiError(err)) }
    finally { lock.current = false; setSaving(false); onBusy(false) }
  }

  return (
    <section className="card" aria-labelledby="entry-title" id="transaction-form">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 id="entry-title" className="text-lg font-semibold">{editing ? 'Edit transaction' : 'Add a transaction'}</h2>
          <p className="mt-1 text-sm text-slate-500">{editing ? 'Update the details below.' : 'Every small entry adds up to a clearer picture.'}</p>
        </div>
        {editing ? <button type="button" disabled={saving || busy} className="btn-secondary" onClick={onCancel} aria-label="Cancel editing"><X size={18} /></button>
          : <span className="rounded-full bg-blue-50 p-2 text-blue-600"><Plus size={18} aria-hidden="true" /></span>}
      </div>
      <form onSubmit={save}>
        <fieldset disabled={saving || busy}>
          <legend className="sr-only">Transaction details</legend>
          <div className="mb-5 inline-flex gap-1 rounded-lg bg-slate-100 p-1" role="group" aria-label="Transaction type">
            {['expense', 'income'].map(type => <button type="button" key={type} aria-pressed={form.type === type}
              onClick={() => update('type', type)}
              className={`rounded-md px-5 py-2 text-sm font-medium capitalize ${form.type === type ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>{type}</button>)}
          </div>
          <label className="label" htmlFor="entry-title-input">{form.type === 'income' ? 'Income source' : 'Description'}</label>
          <input id="entry-title-input" className="field" required maxLength={180} value={form.title} onChange={e => update('title', e.target.value)} placeholder={form.type === 'income' ? 'Salary, freelance, gift…' : 'What did you spend on?'} />
          {form.type === 'expense' && <div className="mt-2 flex flex-wrap gap-2" aria-label="Quick descriptions">
            {['Groceries', 'Fuel', 'Electricity', 'Water'].map(title => <button type="button" key={title} onClick={() => update('title', title)}
              className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700">{title}</button>)}
          </div>}
          <div className="mt-4 grid grid-cols-[1fr_100px] gap-3 sm:grid-cols-[1fr_110px_1fr]">
            <label className="label">Amount<input className="field" type="number" inputMode="decimal" min="0.01" max="999999999999.99" step="0.01" required value={form.amount} placeholder="0.00" onChange={e => update('amount', e.target.value)} /></label>
            <label className="label">Currency<select className="field" value={form.currency} onChange={e => update('currency', e.target.value)}><option>LBP</option><option>USD</option>{!['LBP', 'USD'].includes(form.currency) && <option disabled>{form.currency}</option>}</select></label>
            <label className="label col-span-2 sm:col-span-1">Date<input className="field" type="date" required min="1900-01-01" max="9999-12-31" value={form.date} onChange={e => update('date', e.target.value)} /></label>
          </div>
          <label className="label mt-4">Note <span className="font-normal text-slate-400">(optional)</span><textarea className="field resize-y" rows={2} maxLength={2000} value={form.notes || ''} onChange={e => update('notes', e.target.value)} placeholder="Anything you’d like to remember" /></label>
          <p className="mt-3 text-xs leading-5 text-slate-500">{editing?.lbp_per_usd ? `Saved rate: $1 = ${money(editing.lbp_per_usd, 'LBP')}. Editing keeps this rate.` : rate ? `Configured rate: $1 = ${money(rate.lbpPerUsd, 'LBP')}. This is not a live market rate.` : 'The server saves its configured LBP/USD rate with this entry.'}</p>
          {error && <p className="error-box mt-4" role="alert">{error}</p>}
          <div className="mt-5 flex items-center gap-3">
            <button className="btn-primary flex-1 sm:flex-none" type="submit">{saving ? 'Saving…' : editing ? 'Save changes' : `Add ${form.type}`}</button>
            {editing && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
          </div>
        </fieldset>
      </form>
    </section>
  )
}