import { useMemo, useState } from 'react'
import { CircleDollarSign, Plus, Users } from 'lucide-react'
import {
  createAdminWorker,
  deleteAdminWorker,
  updateAdminWorker,
} from '../lib/api'
import { commissionForJob, jobsInMonth, jobsInRange, monthKey, sumCommission, workerJobs } from '../lib/commission'
import { fortnightBounds, recentFortnights } from '../lib/weeks'
import Button from './Button'

const emptyWorker = {
  fullName: '',
  role: '',
  phone: '',
  commissionPercent: '',
  notes: '',
}

function formatCedis(amount) {
  if (amount == null || amount === '') return '—'
  return `GH₵${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatPercent(value) {
  if (value == null || value === '') return '—'
  return `${Number(value)}%`
}

export default function AdminSalaries({ jobs = [], workers = [], onWorkersUpdated, onUnauthorized }) {
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(emptyWorker)
  const fortnights = useMemo(() => recentFortnights(6), [])
  const currentFortnight = fortnights[0]
  const [periodValue, setPeriodValue] = useState(currentFortnight?.value || '')
  const thisMonth = monthKey(new Date())

  const selectedPeriod = fortnights.find((item) => item.value === periodValue) || currentFortnight || fortnightBounds()

  const periodJobs = useMemo(
    () => jobsInRange(jobs, selectedPeriod.start, selectedPeriod.end),
    [jobs, selectedPeriod.end, selectedPeriod.start],
  )
  const monthJobs = useMemo(() => jobsInMonth(jobs, thisMonth), [jobs, thisMonth])

  const periodPayroll = useMemo(
    () =>
      workers.reduce((sum, worker) => {
        const value = sumCommission(workerJobs(periodJobs, worker.id), worker)
        return sum + (value || 0)
      }, 0),
    [periodJobs, workers],
  )
  const monthPayroll = useMemo(
    () =>
      workers.reduce((sum, worker) => {
        const value = sumCommission(workerJobs(monthJobs, worker.id), worker)
        return sum + (value || 0)
      }, 0),
    [monthJobs, workers],
  )

  function closeForm() {
    setAdding(false)
    setSelected(null)
    setDraft(emptyWorker)
    setError('')
  }

  async function saveWorker(e) {
    e.preventDefault()
    setError('')
    const payload = adding ? draft : selected
    try {
      if (adding) await createAdminWorker(payload)
      else await updateAdminWorker(selected.id, payload)
      closeForm()
      await onWorkersUpdated?.()
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      setError(err.message)
    }
  }

  async function removeWorker(id) {
    if (!window.confirm('Delete this worker from the payroll list?')) return
    try {
      await deleteAdminWorker(id)
      closeForm()
      await onWorkersUpdated?.()
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      setError(err.message)
    }
  }

  const form = adding ? draft : selected
  const setForm = adding ? setDraft : setSelected
  const selectedWork = selected ? workerJobs(periodJobs, selected.id) : []
  const selectedMonthWork = selected ? workerJobs(monthJobs, selected.id) : []

  return (
    <section className="salary-section" id="salaries">
      <div className="salary-head">
        <div>
          <p className="eyebrow">Payroll</p>
          <h2 className="headline" style={{ fontSize: '1.125rem' }}>Worker commissions</h2>
          <p className="field-hint">
            Pay is commission on completed jobs, every 2 weeks. Enter each worker’s agreed percent — nothing is filled in
            for you. Assign a worker on the job record so the work counts.
          </p>
        </div>
        <Button type="button" onClick={() => { setAdding(true); setSelected(null); setDraft(emptyWorker) }}>
          <Plus className="icon-sm" />
          Add worker
        </Button>
      </div>

      <label className="field" style={{ maxWidth: '24rem', marginBottom: '1rem' }}>
        2-week pay period
        <select className="select" value={selectedPeriod.value} onChange={(e) => setPeriodValue(e.target.value)}>
          {fortnights.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <div className="stat-grid salary-stats">
        <div className="stat-card">
          <Users className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Workers</p>
          <p className="headline">{workers.length}</p>
          <p className="field-hint">On the payroll list</p>
        </div>
        <div className="stat-card">
          <CircleDollarSign className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>This pay period</p>
          <p className="headline">{formatCedis(periodPayroll || null)}</p>
          <p className="field-hint">{selectedPeriod.label}</p>
        </div>
        <div className="stat-card">
          <CircleDollarSign className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>This month</p>
          <p className="headline">{formatCedis(monthPayroll || null)}</p>
          <p className="field-hint">Completed jobs this calendar month</p>
        </div>
      </div>

      {error && <p className="field-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="job-table-wrap">
        <table className="job-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Commission</th>
              <th>Jobs this period</th>
              <th className="right">This pay period</th>
              <th className="right">This month</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((worker) => {
              const periodWork = workerJobs(periodJobs, worker.id)
              const monthWork = workerJobs(monthJobs, worker.id)
              return (
                <tr key={worker.id} className="is-clickable" onClick={() => { setSelected(worker); setAdding(false) }}>
                  <td>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>{worker.fullName}</p>
                    <p className="field-hint">{worker.role || 'No role'}{worker.phone ? ` · ${worker.phone}` : ''}</p>
                  </td>
                  <td>{formatPercent(worker.commissionPercent)}</td>
                  <td>{periodWork.length}</td>
                  <td className="right" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {formatCedis(sumCommission(periodWork, worker))}
                  </td>
                  <td className="right" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>
                    {formatCedis(sumCommission(monthWork, worker))}
                  </td>
                </tr>
              )
            })}
            {workers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  No workers yet. Add a worker, enter their commission percent, then assign them on each job they complete.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(adding || selected) && form && (
        <div className="modal">
          <form onSubmit={saveWorker} className="modal-card">
            <h2 className="headline" style={{ fontSize: '1.25rem' }}>{adding ? 'Add a worker' : 'Update worker'}</h2>
            <div className="modal-grid">
              <label className="field">
                Name
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                Role
                <input
                  className="input"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Technician, supervisor…"
                />
              </label>
              <label className="field">
                Phone
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </label>
              <label className="field">
                Commission percent
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.commissionPercent ?? ''}
                  onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
                  placeholder="Agreed share of each completed job"
                />
                <span className="field-hint">Paid every 2 weeks from jobs marked done or paid.</span>
              </label>
              <label className="field">
                Notes
                <input
                  className="input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </label>
            </div>

            {!adding && selected && (
              <div className="commission-jobs">
                <h3 className="field-title">Work this pay period</h3>
                {selectedWork.length === 0 ? (
                  <p className="field-hint">No completed jobs assigned to this worker in {selectedPeriod.label}.</p>
                ) : (
                  <ul className="price-rows">
                    {selectedWork.map((job) => (
                      <li key={job.id}>
                        <span>{job.fullName} · {job.week || 'No week'}</span>
                        <span>{formatCedis(commissionForJob(job, selected))}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <h3 className="field-title" style={{ marginTop: '1rem' }}>Work this month</h3>
                <p className="field-hint">
                  {selectedMonthWork.length} completed job{selectedMonthWork.length === 1 ? '' : 's'} ·{' '}
                  {formatCedis(sumCommission(selectedMonthWork, selected))}
                </p>
              </div>
            )}

            {error && <p className="field-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
            <div className="admin-actions" style={{ marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Button type="submit">{adding ? 'Save worker' : 'Save changes'}</Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Close
              </Button>
              {!adding && selected && (
                <Button type="button" variant="ghost" onClick={() => removeWorker(selected.id)}>
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
