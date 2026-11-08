import { useMemo, useState } from 'react'
import { CircleDollarSign, Plus, Wallet } from 'lucide-react'
import { createAdminExpense, deleteAdminExpense, updateAdminExpense } from '../lib/api'
import { jobsInMonth, monthKey } from '../lib/commission'
import Button from './Button'

// Must match EXPENSE_CATEGORIES in server/expenses.js.
const CATEGORIES = [
  'Cleaning supplies',
  'Transport & fuel',
  'Equipment & repairs',
  'Wages & allowances',
  'Phone & data',
  'Marketing',
  'Rent & utilities',
  'Other',
]

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
]

function today() {
  const now = new Date()
  return `${monthKey(now)}-${String(now.getDate()).padStart(2, '0')}`
}

function emptyExpense() {
  return { date: today(), category: CATEGORIES[0], description: '', amount: '', method: 'cash', paidTo: '', notes: '' }
}

function formatCedis(amount) {
  if (amount == null || amount === '') return '—'
  return `GH₵${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-GH', { month: 'long', year: 'numeric' })
}

function sum(list) {
  return list.reduce((total, expense) => total + (Number(expense.amount) || 0), 0)
}

export default function AdminExpenses({ expenses = [], jobs = [], onExpensesUpdated, onUnauthorized }) {
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(emptyExpense)
  const [month, setMonth] = useState(monthKey(new Date()))
  const [category, setCategory] = useState('all')
  const [saving, setSaving] = useState(false)

  const months = useMemo(() => {
    const keys = new Set(expenses.map((expense) => expense.date.slice(0, 7)).filter(Boolean))
    keys.add(monthKey(new Date()))
    return [...keys].sort().reverse()
  }, [expenses])

  const monthExpenses = useMemo(
    () => (month === 'all' ? expenses : expenses.filter((expense) => expense.date.startsWith(month))),
    [expenses, month],
  )
  const visible = useMemo(
    () => (category === 'all' ? monthExpenses : monthExpenses.filter((expense) => expense.category === category)),
    [category, monthExpenses],
  )
  const byCategory = useMemo(
    () =>
      CATEGORIES.map((name) => ({ name, total: sum(monthExpenses.filter((expense) => expense.category === name)) }))
        .filter((row) => row.total > 0)
        .sort((a, b) => b.total - a.total),
    [monthExpenses],
  )

  const spent = sum(monthExpenses)
  // Same figure as "Month earned" on the jobs page: paid jobs, counted in the month they are worked.
  const earned = useMemo(() => {
    const paid = (month === 'all' ? jobs : jobsInMonth(jobs, month)).filter((job) => job.status === 'paid')
    return paid.reduce((total, job) => total + (Number(job.amount) || 0), 0)
  }, [jobs, month])
  const balance = earned - spent
  const periodLabel = month === 'all' ? 'All time' : monthLabel(month)

  function closeForm() {
    setAdding(false)
    setSelected(null)
    setDraft(emptyExpense())
    setError('')
  }

  async function saveExpense(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (adding) await createAdminExpense(draft)
      else await updateAdminExpense(selected.id, selected)
      closeForm()
      await onExpensesUpdated?.()
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function removeExpense(id) {
    if (!window.confirm('Delete this expense?')) return
    try {
      await deleteAdminExpense(id)
      closeForm()
      await onExpensesUpdated?.()
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      setError(err.message)
    }
  }

  const form = adding ? draft : selected
  const setForm = adding ? setDraft : setSelected

  return (
    <section className="salary-section" id="expenses">
      <div className="salary-head">
        <div>
          <p className="eyebrow">Spending</p>
          <h2 className="headline" style={{ fontSize: '1.125rem' }}>Business expenses</h2>
          <p className="field-hint">
            Record money spent running the business, such as supplies, fuel and repairs. Worker commissions are worked out on
            the Salaries page, so only add wages here if they are paid outside commission.
          </p>
        </div>
        <Button type="button" onClick={() => { setAdding(true); setSelected(null); setDraft(emptyExpense()); setError('') }}>
          <Plus className="icon-sm" />
          Add expense
        </Button>
      </div>

      <div className="admin-filters" style={{ marginTop: 0, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <label className="field" style={{ width: '100%', maxWidth: '20rem' }}>
          Month
          <select className="select" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All time</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {monthLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ width: '100%', maxWidth: '20rem' }}>
          Category
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stat-grid salary-stats">
        <div className="stat-card">
          <Wallet className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Spent</p>
          <p className="headline">{formatCedis(spent)}</p>
          <p className="field-hint">{periodLabel} · {monthExpenses.length} expense{monthExpenses.length === 1 ? '' : 's'}</p>
        </div>
        <div className="stat-card">
          <CircleDollarSign className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Earned</p>
          <p className="headline">{formatCedis(earned)}</p>
          <p className="field-hint">Jobs marked as paid</p>
        </div>
        <div className="stat-card">
          <CircleDollarSign className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Left after expenses</p>
          <p className="headline" style={{ color: balance < 0 ? 'var(--color-danger, #b42318)' : undefined }}>
            {balance < 0 ? `−${formatCedis(-balance)}` : formatCedis(balance)}
          </p>
          <p className="field-hint">Earned minus spent, before worker commissions</p>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="price-list" style={{ marginTop: '1rem' }}>
          <h3 className="field-title">Spent by category · {periodLabel}</h3>
          <ul className="price-rows">
            {byCategory.map((row) => (
              <li key={row.name}>
                <span>{row.name}</span>
                <span>{formatCedis(row.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && !adding && !selected && <p className="field-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="job-table-wrap">
        <table className="job-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>What for</th>
              <th>Category</th>
              <th>Paid by</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((expense) => (
              <tr key={expense.id} className="is-clickable" onClick={() => { setSelected(expense); setAdding(false); setError('') }}>
                <td>{formatDate(expense.date)}</td>
                <td>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>{expense.description}</p>
                  {expense.paidTo && <p className="field-hint">To {expense.paidTo}</p>}
                </td>
                <td>{expense.category}</td>
                <td>{METHODS.find((item) => item.value === expense.method)?.label || 'Cash'}</td>
                <td className="right" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                  {formatCedis(expense.amount)}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  {expenses.length === 0
                    ? 'No expenses yet. Use Add expense to record money spent on the business.'
                    : 'No expenses match this month and category.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(adding || selected) && form && (
        <div className="modal">
          <form onSubmit={saveExpense} className="modal-card">
            <h2 className="headline" style={{ fontSize: '1.25rem' }}>{adding ? 'Add an expense' : 'Update expense'}</h2>
            <div className="modal-grid">
              <label className="field">
                Date
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                Amount (GH₵)
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount ?? ''}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                What was it for?
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Chlorine, fuel to Kasoa, new brush…"
                  maxLength={200}
                  required
                />
              </label>
              <label className="field">
                Category
                <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Paid by
                <select className="select" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {METHODS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Paid to
                <input
                  className="input"
                  value={form.paidTo}
                  onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                  placeholder="Shop or person (optional)"
                  maxLength={120}
                />
              </label>
              <label className="field">
                Notes
                <input
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  maxLength={1000}
                />
              </label>
            </div>

            {error && <p className="field-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
            <div className="admin-actions" style={{ marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Button type="submit" disabled={saving}>{adding ? 'Save expense' : 'Save changes'}</Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Close
              </Button>
              {!adding && selected && (
                <Button type="button" variant="ghost" onClick={() => removeExpense(selected.id)}>
                  Delete
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
