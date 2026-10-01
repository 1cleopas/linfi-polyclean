import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CircleDollarSign, ClipboardList, LogOut, Plus, ReceiptText, Search } from 'lucide-react'
import { services, tankSizes, tankTypes } from '../data/content'
import { nextCleaningDate, workWeeksForMonths } from '../lib/weeks'
import {
  adminLogin,
  adminLoginCode,
  createAdminJob,
  deleteAdminJob,
  getAdminToken,
  listAdminJobs,
  setAdminToken,
  updateAdminJob,
} from '../lib/api'
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
  const [challengeId, setChallengeId] = useState('')
  const [setupSecret, setSetupSecret] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [jobs, setJobs] = useState([])
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

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]')
    if (!meta) return undefined
    const previous = meta.getAttribute('content')
    meta.setAttribute('content', 'noindex, nofollow')
    return () => meta.setAttribute('content', previous || 'index, follow')
  }, [])

  async function refresh() {
    const seq = ++requestSeq.current
    try {
      const data = await listAdminJobs()
      if (seq !== requestSeq.current) return
      setJobs(data.jobs || [])
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
    setSubmitting(true)
    try {
      const data = await adminLogin(password)
      if (data.token) {
        setAdminToken(data.token)
        setTokenReady(true)
        setPassword('')
        return
      }
      setChallengeId(data.challengeId)
      setSetupSecret(data.setup ? data.secret : '')
      setPassword('')
      setCode('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function onCode(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await adminLoginCode(challengeId, code)
      setAdminToken(data.token)
      setTokenReady(true)
      setChallengeId('')
      setSetupSecret('')
      setCode('')
    } catch (err) {
      setError(err.message)
      if (/expired|password again/i.test(err.message)) {
        setChallengeId('')
        setSetupSecret('')
      }
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
      <main className="flex min-h-screen items-center justify-center bg-surface px-4">
        <form onSubmit={challengeId ? onCode : onLogin} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">Manager</p>
          <h1 className="font-headline mt-2 text-2xl font-bold text-primary">LINFI POLYCLEAN</h1>
          <p className="mt-2 text-sm text-muted">
            {setupSecret
              ? 'Open Authenticator, add an account, and type this key. Then enter the 6-digit code it shows.'
              : challengeId
                ? 'Enter the 6-digit code from Authenticator. It changes every 30 seconds.'
                : 'Every sign-in needs the manager password and a one-time code from Authenticator. Do not share this page with customers.'}
          </p>
          {setupSecret ? (
            <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-primary">{setupSecret}</p>
          ) : null}
          {challengeId ? (
            <label className="mt-6 block text-sm font-semibold text-primary">
              Authenticator code
              <input
                className="mt-1 w-full rounded-lg border border-outline/70 bg-surface px-3 py-3 tracking-[0.3em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
          ) : (
            <label className="mt-6 block text-sm font-semibold text-primary">
              Password
              <input
                className="mt-1 w-full rounded-lg border border-outline/70 bg-surface px-3 py-3"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth className="mt-6" disabled={submitting}>
            {challengeId ? 'Open dashboard' : 'Continue'}
          </Button>
          {challengeId && (
            <button
              type="button"
              className="mt-4 w-full text-sm font-semibold text-secondary"
              onClick={() => {
                setChallengeId('')
                setSetupSecret('')
                setCode('')
                setError('')
              }}
            >
              Use the password again
            </button>
          )}
        </form>
      </main>
    )
  }

  const fieldClass = 'w-full rounded-lg border border-outline/70 bg-surface px-3 py-2 text-sm'

  return (
    <main className="min-h-screen bg-surface px-4 py-8 md:px-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">Manager dashboard</p>
            <h1 className="font-headline mt-2 text-3xl font-bold text-primary">Jobs & bookings</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              Add job
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAdminToken('')
                setTokenReady(false)
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
            <CalendarDays className="h-5 w-5 text-secondary" />
            <label className="mt-3 block text-xs font-bold tracking-wider text-muted uppercase">
              Bookings in week
              <select
                className="mt-2 w-full rounded-lg border border-outline/70 bg-surface px-2 py-2 text-xs font-semibold tracking-normal text-primary normal-case"
                value={selectedCountWeek}
                onChange={(e) => {
                  setCountWeek(e.target.value)
                  setWeekFilter(e.target.value)
                }}
              >
                {weekChoices.map((week) => (
                  <option key={week.value} value={week.label}>
                    {week.label}
                  </option>
                ))}
              </select>
            </label>
            <p className="font-headline mt-3 text-2xl font-bold text-primary">{selectedWeekCount}</p>
            <p className="mt-1 text-xs text-muted">No weekly cap</p>
          </div>
          <Stat icon={CircleDollarSign} label="Month estimate" value={formatCedis(monthlyEstimate)} note="Quoted amounts this month" />
          <Stat icon={CircleDollarSign} label="Month earned" value={formatCedis(monthlyEarned)} note="Marked as paid" />
          <Stat icon={ClipboardList} label="Jobs completed" value={String(doneCount)} note="Done or paid in total" />
        </div>

        <section className="mt-8 rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
          <h2 className="font-headline text-lg font-bold text-primary">Price list</h2>
          <p className="mt-1 text-sm text-muted">Prices may vary due to location and tank position.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PRICE_LIST.map((item) => (
              <li key={item.size} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2 text-sm">
                <span className="text-primary">{item.size}</span>
                <span className="font-semibold text-secondary">{formatCedis(item.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">Add GH₵50 for tanks above 2 storeys.</p>
        </section>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="absolute top-3 left-3 h-4 w-4 text-muted" />
            <input
              className="w-full rounded-lg border border-outline/70 bg-surface py-2 pr-3 pl-9 text-sm"
              placeholder="Search name, phone, area or week"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select className={fieldClass + ' md:w-40'} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            className={fieldClass + ' md:w-64'}
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
          <select className={fieldClass + ' md:w-44'} value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="all">All months</option>
            {months.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <select className={fieldClass + ' md:w-40'} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="week">Sort by week</option>
            <option value="status">Sort by status</option>
            <option value="amount">Sort by amount</option>
          </select>
        </div>

        {(error || loadError) && <p className="mt-4 text-sm text-red-600">{error || loadError}</p>}
        {loading && <p className="mt-4 text-sm text-muted">Loading jobs…</p>}

        <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-[var(--shadow-card)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-low text-xs tracking-wider text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/30">
              {(() => {
                const shown = new Set()
                return visible.map((job) => {
                  const receiptId = leadReceiptId(job, jobs)
                  const showReceipt = !shown.has(receiptId)
                  if (showReceipt) shown.add(receiptId)
                  return (
                <tr key={job.id} className="cursor-pointer hover:bg-surface" onClick={() => setSelected(job)}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary">{job.fullName}</p>
                    <p className="text-xs text-muted">
                      {job.location} · {job.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {job.week || '—'}
                    {job.week ? (
                      <span className="mt-1 block text-xs">{weekCounts[job.week] || 0} booking{(weekCounts[job.week] || 0) === 1 ? '' : 's'}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <p>{job.service || 'Polytank cleaning'}</p>
                    <p className="text-xs">{job.tankSize || 'Size not given'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-surface px-2 py-1 text-xs font-semibold text-primary">
                      {statusLabel(job.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-secondary">{formatCedis(job.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    {showReceipt ? (
                      <a
                        href={`/admin/receipt/${receiptId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-surface-low"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
                        Receipt
                      </a>
                    ) : (
                      <span className="text-xs text-muted">On this receipt</span>
                    )}
                  </td>
                </tr>
                  )
                })
              })()}
              {visible.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-muted" colSpan={6}>
                    No jobs match these filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(selected || adding) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 px-4">
          <form
            onSubmit={adding ? addJob : saveSelected}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
          >
            <h2 className="font-headline text-xl font-bold text-primary">{adding ? 'Add a job' : 'Update job'}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Name" value={adding ? draft.fullName : selected.fullName} onChange={(value) => (adding ? setDraft({ ...draft, fullName: value }) : setSelected({ ...selected, fullName: value }))} />
              <Field label="Phone" value={adding ? draft.phone : selected.phone} onChange={(value) => (adding ? setDraft({ ...draft, phone: value }) : setSelected({ ...selected, phone: value }))} />
              <Field label="Location" value={adding ? draft.location : selected.location} onChange={(value) => (adding ? setDraft({ ...draft, location: value }) : setSelected({ ...selected, location: value }))} />
              <label className="text-xs font-semibold tracking-wide text-muted uppercase">
                Week
                <select
                  className={`${fieldClass} mt-1`}
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
                  <span className="mt-1 block text-xs font-medium tracking-normal text-primary normal-case">
                    Next cleaning date: {formatNextCleaning(adding ? draft.week : selected.week)}
                  </span>
                )}
              </label>
              <label className="text-xs font-semibold tracking-wide text-muted uppercase">
                Service
                <select
                  className={`${fieldClass} mt-1`}
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
              <label className="text-xs font-semibold tracking-wide text-muted uppercase">
                Tank size
                <select
                  className={`${fieldClass} mt-1`}
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
                  <span className="mt-1 block text-xs font-medium tracking-normal text-primary normal-case">
                    Base price: {formatCedis(priceForSize(adding ? draft.tankSize : selected.tankSize))}. Add GH₵50 above 2 storeys.
                  </span>
                )}
              </label>
              <label className="text-xs font-semibold tracking-wide text-muted uppercase">
                Tank type
                <select
                  className={`${fieldClass} mt-1`}
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
              <label className="text-xs font-semibold tracking-wide text-muted uppercase">
                Status
                <select
                  className={`${fieldClass} mt-1`}
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
            <div className="mt-6 flex flex-wrap gap-2">
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
    <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-card)]">
      <Icon className="h-5 w-5 text-secondary" />
      <p className="mt-3 text-xs font-bold tracking-wider text-muted uppercase">{label}</p>
      <p className="font-headline mt-1 text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="text-xs font-semibold tracking-wide text-muted uppercase">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-outline/70 bg-surface px-3 py-2 text-sm"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
