import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CircleDollarSign, ClipboardList, Eye, EyeOff, LogOut, Plus, ReceiptText, Search } from 'lucide-react'
import { services, tankSizes, tankTypes } from '../data/content'
import { nextCleaningDate, workWeeksForMonths } from '../lib/weeks'
import {
  adminLogin,
  createAdminJob,
  deleteAdminJob,
  getAdminToken,
  listAdminJobs,
  listAdminWorkers,
  setAdminToken,
  updateAdminJob,
  wakeAdminApi,
} from '../lib/api'
import AdminSalaries from '../components/AdminSalaries'
import Button from '../components/Button'

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'done', label: 'Done' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

const emptyJob = {
  fullName: '',
  phone: '',
  whatsapp: '',
  location: '',
  service: '',
  tankType: '',
  tankSize: '',
  tanks: '',
  week: '',
  time: '',
  extra: '',
  status: 'confirmed',
  amount: '',
  notes: '',
  workerId: '',
}

function formatCedis(amount) {
  if (amount == null || amount === '') return '—'
  return `GH₵${Number(amount).toLocaleString('en-GH')}`
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function jobMonth(job) {
  return monthKey(new Date(job.createdAt))
}

function statusLabel(value) {
  return STATUSES.find((item) => item.value === value)?.label || value
}

function formatNextCleaning(week) {
  const next = nextCleaningDate(week)
  if (!next) return ''
  return next.toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })
}

function customerKey(job) {
  const name = String(job.fullName || '').trim().toLowerCase()
  const phone = String(job.phone || job.whatsapp || '').replace(/\D/g, '')
  return `${name}|${phone}|${job.week || ''}`
}

function leadReceiptId(job, allJobs) {
  const lead = allJobs
    .filter((item) => item.status !== 'cancelled' && customerKey(item) === customerKey(job))
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))[0]
  return lead?.id || job.id
}

const PRICE_LIST = [
  { size: '500L – 1,500L', amount: 300 },
  { size: '1,501L – 2,500L', amount: 400 },
  { size: '2,501L – 3,500L', amount: 450 },
  { size: '3,501L – 4,500L', amount: 550 },
  { size: '4,501L – 5,500L', amount: 600 },
  { size: '5,501L – 6,500L', amount: 650 },
  { size: '6,501L – 7,500L', amount: 700 },
  { size: '7,501L – 8,500L', amount: 750 },
  { size: '8,501L – 9,500L', amount: 800 },
  { size: '10,000L and above', amount: 900 },
]

function priceForSize(size) {
  return PRICE_LIST.find((item) => item.size === size)?.amount
}

export default function Admin() {
  const [tokenReady, setTokenReady] = useState(Boolean(getAdminToken()))
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [jobs, setJobs] = useState([])
  const [workers, setWorkers] = useState([])
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('week')
  const [weekFilter, setWeekFilter] = useState('all')
  const [countWeek, setCountWeek] = useState('')
  const [month, setMonth] = useState('all')
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptyJob)
  const weeks = useMemo(() => workWeeksForMonths(3), [])
  const requestSeq = useRef(0)
  const handleUnauthorized = useCallback(() => {
    setAdminToken('')
    setTokenReady(false)
  }, [])

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]')
    if (!meta) return undefined
    const previous = meta.getAttribute('content')
    meta.setAttribute('content', 'noindex, nofollow')
    return () => meta.setAttribute('content', previous || 'index, follow')
  }, [])

  useEffect(() => {
    if (tokenReady) return undefined
    wakeAdminApi()
    return undefined
  }, [tokenReady])

  async function refresh() {
    const seq = ++requestSeq.current
    try {
      const [jobData, workerData] = await Promise.all([listAdminJobs(), listAdminWorkers()])
      if (seq !== requestSeq.current) return
      setJobs(jobData.jobs || [])
      setWorkers(workerData.workers || [])
      setLoadError('')
    } catch (err) {
      if (seq !== requestSeq.current) return
      throw err
    }
  }

  useEffect(() => {
    if (!tokenReady) return undefined

    let cancelled = false
    const load = (showSpinner = false) => {
      if (showSpinner) setLoading(true)
      return refresh()
        .catch((err) => {
          if (cancelled) return
          if (err.status === 401) {
            setAdminToken('')
            setTokenReady(false)
          }
          setLoadError(err.message)
        })
        .finally(() => {
          if (!cancelled && showSpinner) setLoading(false)
        })
    }

    load(true)
    const timer = window.setInterval(() => load(false), 8000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [tokenReady])

  const thisMonth = monthKey(new Date())
  const monthJobs = useMemo(
    () => jobs.filter((job) => jobMonth(job) === thisMonth && job.status !== 'cancelled'),
    [jobs, thisMonth],
  )

  const monthlyEstimate = monthJobs.reduce((sum, job) => sum + (Number(job.amount) || 0), 0)
  const monthlyEarned = monthJobs
    .filter((job) => job.status === 'paid')
    .reduce((sum, job) => sum + (Number(job.amount) || 0), 0)
  const doneCount = jobs.filter((job) => job.status === 'done' || job.status === 'paid').length

  const weekCounts = useMemo(() => {
    const counts = {}
    for (const job of jobs) {
      if (!job.week || job.status === 'cancelled') continue
      counts[job.week] = (counts[job.week] || 0) + 1
    }
    return counts
  }, [jobs])

  const weekChoices = useMemo(() => {
    const known = new Set(weeks.map((week) => week.label))
    const extras = Object.keys(weekCounts).filter((label) => !known.has(label))
    return [...weeks, ...extras.map((label) => ({ value: label, label }))]
  }, [weekCounts, weeks])
  const selectedCountWeek = weekChoices.some((week) => week.label === countWeek) ? countWeek : weeks[0]?.label || ''
  const selectedWeekCount = weekCounts[selectedCountWeek] || 0

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const next = jobs.filter((job) => {
      if (status !== 'all' && job.status !== status) return false
      if (weekFilter !== 'all' && job.week !== weekFilter) return false
      if (month !== 'all' && jobMonth(job) !== month) return false
      if (!query) return true
      return [job.fullName, job.phone, job.location, job.week, job.service, job.tankSize]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })

    next.sort((a, b) => {
      if (sort === 'amount') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
      if (sort === 'week') {
        const order = weeks.map((week) => week.label)
        const aIndex = order.indexOf(a.week)
        const bIndex = order.indexOf(b.week)
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
      }
      if (sort === 'status') return String(a.status).localeCompare(String(b.status))
      return String(b.createdAt).localeCompare(String(a.createdAt))
    })
    return next
  }, [jobs, month, search, sort, status, weekFilter, weeks])

  const months = useMemo(() => {
    const keys = new Set(jobs.map(jobMonth))
    keys.add(monthKey(new Date()))
    return [...keys].sort().reverse()
  }, [jobs])

  async function onLogin(e) {
    e.preventDefault()
    setError('')
    if (!password.trim()) {
      setError('Enter the manager password first.')
      return
    }
    setSubmitting(true)
    try {
      const data = await adminLogin(password)
      setAdminToken(data.token)
      setTokenReady(true)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function saveSelected(e) {
    e.preventDefault()
    if (!selected) return
    setError('')
    try {
      const data = await updateAdminJob(selected.id, selected)
      setJobs((prev) => prev.map((job) => (job.id === data.job.id ? data.job : job)))
      setSelected(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addJob(e) {
    e.preventDefault()
    setError('')
    try {
      const data = await createAdminJob({ ...draft, source: 'manual' })
      setJobs((prev) => [data.job, ...prev])
      setDraft(emptyJob)
      setAdding(false)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeJob(id) {
    if (!window.confirm('Delete this job record?')) return
    try {
      await deleteAdminJob(id)
      setJobs((prev) => prev.filter((job) => job.id !== id))
      if (selected?.id === id) setSelected(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  if (!tokenReady) {
    return (
      <main className="admin-login">
        <form onSubmit={onLogin} className="login-card">
          <p className="eyebrow">Manager</p>
          <h1 className="headline">LINFI POLYCLEAN</h1>
          <p className="lede">Enter the manager password to open the dashboard.</p>
          <label className="field field-title" style={{ marginTop: '1.5rem' }}>
            Password
            <span className="password-wrap">
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((open) => !open)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="icon-lg" strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  <Eye className="icon-lg" strokeWidth={2.25} aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
          {error && <p className="field-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
          <div style={{ marginTop: '1.5rem' }}>
            <Button type="submit" fullWidth disabled={submitting}>
              Open dashboard
            </Button>
          </div>
        </form>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <div className="wrap">
        <div className="admin-head">
          <div>
            <p className="eyebrow">Manager dashboard</p>
            <h1 className="headline">Jobs, bookings & salaries</h1>
          </div>
          <div className="admin-actions">
            <Button variant="outline" href="#salaries">
              Salaries
            </Button>
            <Button onClick={() => setAdding(true)}>
              <Plus className="icon-sm" />
              Add job
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAdminToken('')
                setTokenReady(false)
              }}
            >
              <LogOut className="icon-sm" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <CalendarDays className="icon" />
            <label className="field" style={{ marginTop: '0.75rem' }}>
              Bookings in week
              <select className="select" value={selectedCountWeek} onChange={(e) => setCountWeek(e.target.value)}>
                {weekChoices.map((week) => (
                  <option key={week.value} value={week.label}>
                    {week.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="headline" style={{ marginTop: '0.75rem' }}>{selectedWeekCount}</p>
            <p className="field-hint">No weekly cap</p>
          </div>
          <Stat icon={CircleDollarSign} label="Month estimate" value={formatCedis(monthlyEstimate)} note="Quoted amounts this month" />
          <Stat icon={CircleDollarSign} label="Month earned" value={formatCedis(monthlyEarned)} note="Marked as paid" />
          <Stat icon={ClipboardList} label="Jobs completed" value={String(doneCount)} note="Done or paid in total" />
        </div>

        <section className="price-list" style={{ marginTop: '2rem' }}>
          <h2 className="headline" style={{ fontSize: '1.125rem' }}>Price list</h2>
          <p className="field-hint">Prices may vary due to location and tank position.</p>
          <ul className="price-rows">
            {PRICE_LIST.map((item) => (
              <li key={item.size}>
                <span>{item.size}</span>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{formatCedis(item.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="field-hint" style={{ marginTop: '0.75rem' }}>Add GH₵50 for tanks above 2 storeys.</p>
        </section>

        <AdminSalaries
          jobs={jobs}
          workers={workers}
          onWorkersUpdated={refresh}
          onUnauthorized={handleUnauthorized}
        />

        <div className="admin-filters">
          <label className="search-wrap">
            <Search className="icon-sm" />
            <input
              className="input"
              placeholder="Search name, phone, area or week"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className="select"
            value={weekFilter}
            onChange={(e) => {
              setWeekFilter(e.target.value)
              if (e.target.value !== 'all') setCountWeek(e.target.value)
            }}
          >
            <option value="all">All weeks (next 3 months)</option>
            {weekChoices.map((week) => (
              <option key={week.value} value={week.label}>
                {week.label} ({weekCounts[week.label] || 0})
              </option>
            ))}
          </select>
          <select className="select" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All months</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="week">Sort by week</option>
            <option value="status">Sort by status</option>
            <option value="amount">Sort by amount</option>
          </select>
        </div>

        {(error || loadError) && <p className="field-error" style={{ marginTop: '1rem' }}>{error || loadError}</p>}
        {loading && <p className="field-hint" style={{ marginTop: '1rem' }}>Loading jobs…</p>}

        <div className="job-table-wrap">
          <table className="job-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Week</th>
                <th>Worker</th>
                <th>Service</th>
                <th>Status</th>
                <th className="right">Amount</th>
                <th className="right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const shown = new Set()
                return visible.map((job) => {
                  const receiptId = leadReceiptId(job, jobs)
                  const showReceipt = !shown.has(receiptId)
                  if (showReceipt) shown.add(receiptId)
                  return (
                    <tr key={job.id} className="is-clickable" onClick={() => setSelected(job)}>
                      <td>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>{job.fullName}</p>
                        <p className="field-hint">{job.location} · {job.phone}</p>
                      </td>
                      <td>
                        {job.week || '—'}
                        {job.week ? (
                          <span className="field-hint" style={{ display: 'block' }}>
                            {weekCounts[job.week] || 0} booking{(weekCounts[job.week] || 0) === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </td>
                      <td>{workers.find((worker) => worker.id === job.workerId)?.fullName || '—'}</td>
                      <td>
                        <p style={{ margin: 0 }}>{job.service || 'Polytank cleaning'}</p>
                        <p className="field-hint">{job.tankSize || 'Size not given'}</p>
                      </td>
                      <td>
                        <span className="status-pill">{statusLabel(job.status)}</span>
                      </td>
                      <td className="right" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{formatCedis(job.amount)}</td>
                      <td className="right">
                        {showReceipt ? (
                          <a
                            href={`/admin/receipt/${receiptId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="receipt-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ReceiptText className="icon-xs" aria-hidden="true" />
                            Receipt
                          </a>
                        ) : (
                          <span className="field-hint">On this receipt</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              })()}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                    No jobs match these filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(selected || adding) && (
        <div className="modal">
          <form onSubmit={adding ? addJob : saveSelected} className="modal-card">
            <h2 className="headline" style={{ fontSize: '1.25rem' }}>{adding ? 'Add a job' : 'Update job'}</h2>
            <div className="modal-grid">
              <Field label="Name" value={adding ? draft.fullName : selected.fullName} onChange={(value) => (adding ? setDraft({ ...draft, fullName: value }) : setSelected({ ...selected, fullName: value }))} />
              <Field label="Phone" value={adding ? draft.phone : selected.phone} onChange={(value) => (adding ? setDraft({ ...draft, phone: value }) : setSelected({ ...selected, phone: value }))} />
              <Field label="Location" value={adding ? draft.location : selected.location} onChange={(value) => (adding ? setDraft({ ...draft, location: value }) : setSelected({ ...selected, location: value }))} />
              <label className="field">
                Week
                <select
                  className="select"
                  value={adding ? draft.week : selected.week}
                  onChange={(e) => (adding ? setDraft({ ...draft, week: e.target.value }) : setSelected({ ...selected, week: e.target.value }))}
                >
                  <option value="">Select week</option>
                  {(() => {
                    const current = adding ? draft.week : selected.week
                    if (current && !weeks.some((week) => week.label === current)) {
                      return <option value={current}>{current}</option>
                    }
                    return null
                  })()}
                  {weeks.map((week) => (
                    <option key={week.value} value={week.label}>
                      {week.label} ({weekCounts[week.label] || 0})
                    </option>
                  ))}
                </select>
                {formatNextCleaning(adding ? draft.week : selected.week) && (
                  <span className="field-hint">Next cleaning date: {formatNextCleaning(adding ? draft.week : selected.week)}</span>
                )}
              </label>
              <label className="field">
                Service
                <select
                  className="select"
                  value={adding ? draft.service : selected.service}
                  onChange={(e) => (adding ? setDraft({ ...draft, service: e.target.value }) : setSelected({ ...selected, service: e.target.value }))}
                >
                  <option value="">Select service</option>
                  {services.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Tank size
                <select
                  className="select"
                  value={adding ? draft.tankSize : selected.tankSize}
                  onChange={(e) => (adding ? setDraft({ ...draft, tankSize: e.target.value }) : setSelected({ ...selected, tankSize: e.target.value }))}
                >
                  <option value="">Select size</option>
                  {(() => {
                    const current = adding ? draft.tankSize : selected.tankSize
                    if (current && !tankSizes.includes(current)) {
                      return <option value={current}>{current}</option>
                    }
                    return null
                  })()}
                  {tankSizes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {priceForSize(adding ? draft.tankSize : selected.tankSize) != null && (
                  <span className="field-hint">
                    Base price: {formatCedis(priceForSize(adding ? draft.tankSize : selected.tankSize))}. Add GH₵50 above 2 storeys.
                  </span>
                )}
              </label>
              <label className="field">
                Tank type
                <select
                  className="select"
                  value={adding ? draft.tankType : selected.tankType}
                  onChange={(e) => (adding ? setDraft({ ...draft, tankType: e.target.value }) : setSelected({ ...selected, tankType: e.target.value }))}
                >
                  <option value="">Select type</option>
                  {tankTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Status
                <select
                  className="select"
                  value={adding ? draft.status : selected.status}
                  onChange={(e) => (adding ? setDraft({ ...draft, status: e.target.value }) : setSelected({ ...selected, status: e.target.value }))}
                >
                  {STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Worker
                <select
                  className="select"
                  value={adding ? draft.workerId : selected.workerId || ''}
                  onChange={(e) => (adding ? setDraft({ ...draft, workerId: e.target.value }) : setSelected({ ...selected, workerId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.fullName}
                    </option>
                  ))}
                </select>
                <span className="field-hint">Commission is counted when this job is marked done or paid.</span>
              </label>
              <Field
                label="Amount earned (GH₵)"
                type="number"
                value={adding ? draft.amount : selected.amount ?? ''}
                onChange={(value) => (adding ? setDraft({ ...draft, amount: value }) : setSelected({ ...selected, amount: value }))}
              />
              <Field
                label="Notes"
                value={adding ? draft.notes : selected.notes}
                onChange={(value) => (adding ? setDraft({ ...draft, notes: value }) : setSelected({ ...selected, notes: value }))}
              />
            </div>
            <div className="admin-actions" style={{ marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Button type="submit">{adding ? 'Save job' : 'Save changes'}</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelected(null)
                  setAdding(false)
                }}
              >
                Close
              </Button>
              {!adding && selected && (
                <Button type="button" variant="outline" href={`/admin/receipt/${leadReceiptId(selected, jobs)}`} target="_blank">
                  Receipt
                </Button>
              )}
              {!adding && selected && (
                <Button type="button" variant="ghost" onClick={() => removeJob(selected.id)}>
                  Delete
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="stat-card">
      <Icon className="icon" />
      <p className="eyebrow" style={{ marginTop: '0.75rem' }}>{label}</p>
      <p className="headline">{value}</p>
      <p className="field-hint">{note}</p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field">
      {label}
      <input className="input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
