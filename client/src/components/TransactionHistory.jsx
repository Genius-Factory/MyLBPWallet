import { useState } from 'react'
import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { dateLabel, money } from '../lib/format'

export default function TransactionHistory({ data, type, page, onType, onPage, onEdit, onDelete, busy }) {
  const [confirmId, setConfirmId] = useState(null)
  return (
    <section className="card" aria-labelledby="history-title">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 id="history-title" className="text-lg font-semibold">Transaction history</h2><p className="mt-1 text-sm text-slate-500">{data.pagination.total} matching entries</p></div>
        <label className="flex items-center gap-3 text-sm text-slate-500">Show<select value={type} disabled={busy} onChange={e => { setConfirmId(null); onType(e.target.value) }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700"><option value="all">All transactions</option><option value="income">Income</option><option value="expense">Expenses</option></select></label>
      </div>
      {!data.transactions.length ? <div className="py-14 text-center"><p className="font-medium text-slate-700">No transactions to show</p><p className="mt-2 text-sm text-slate-500">Add an entry above or choose a different month or filter.</p></div>
        : <ul className="mt-5 divide-y divide-slate-100">
          {data.transactions.map(item => <li key={item.id} className="py-4">
            <div className="flex items-start gap-3 sm:items-center">
              <span className={`mt-1 hidden rounded-xl p-2.5 sm:block ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{item.type === 'income' ? <ArrowDownLeft size={19} /> : <ArrowUpRight size={19} />}</span>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500"><span className="capitalize">{item.type}</span> · {dateLabel(item.date)}</p>
                {item.notes && <p className="mt-1 break-words text-xs text-slate-500">{item.notes}</p>}
                {item.excluded_from_totals && <p className="mt-1 text-xs text-amber-700">Legacy entry excluded from totals. Edit to use a supported currency and type.</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-5">
                <span className={`text-sm font-semibold tabular-nums ${item.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>{item.type === 'income' ? '+' : '−'}{['USD', 'LBP'].includes(item.currency) ? money(item.amount, item.currency) : `${item.amount} ${item.currency}`}</span>
                <div className="flex gap-1">
                  <button type="button" disabled={busy} onClick={() => onEdit(item)} className="rounded-lg p-2.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label={`Edit ${item.title}`}><Pencil size={16} /></button>
                  <button type="button" disabled={busy} onClick={() => setConfirmId(item.id)} className="rounded-lg p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${item.title}`}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
            {confirmId === item.id && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-rose-50 p-3 text-sm" role="group" aria-label="Confirm deletion"><span>Delete “{item.title}”?</span><button type="button" disabled={busy} className="rounded-lg bg-rose-600 px-3 py-2 font-medium text-white" onClick={async () => { if (await onDelete(item.id)) setConfirmId(null) }}>{busy ? 'Deleting…' : 'Delete entry'}</button><button type="button" disabled={busy} className="btn-secondary" onClick={() => setConfirmId(null)}>Keep entry</button></div>}
          </li>)}
        </ul>}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">Page {page} of {data.pagination.pages}</p>
        <div className="flex gap-2"><button type="button" className="btn-secondary" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>Previous</button><button type="button" className="btn-secondary" disabled={busy || page >= data.pagination.pages} onClick={() => onPage(page + 1)}>Next</button></div>
      </div>
    </section>
  )
}