import { firstCleaningDate } from './weeks'

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const COUNTED = new Set(['done', 'paid'])

export function jobWorkDate(job) {
  return firstCleaningDate(job.week) || (job.createdAt ? new Date(job.createdAt) : null)
}

export function isCompletedJob(job) {
  return COUNTED.has(job.status)
}

export function workerJobs(jobs, workerId) {
  return (jobs || []).filter((job) => job.workerId && job.workerId === workerId && isCompletedJob(job))
}

export function commissionForJob(job, worker) {
  if (!worker || !job || job.workerId !== worker.id || !isCompletedJob(job)) return null
  if (job.amount == null || job.amount === '' || worker.commissionPercent == null) return null
  const amount = Number(job.amount)
  const rate = Number(worker.commissionPercent)
  if (Number.isNaN(amount) || Number.isNaN(rate)) return null
  return amount * (rate / 100)
}

export function sumCommission(jobs, worker) {
  let total = 0
  let counted = false
  for (const job of jobs) {
    const value = commissionForJob(job, worker)
    if (value == null) continue
    counted = true
    total += value
  }
  return counted ? total : null
}

export function jobsInMonth(jobs, key) {
  return (jobs || []).filter((job) => {
    const date = jobWorkDate(job)
    return date && monthKey(date) === key
  })
}

export function jobsInRange(jobs, start, end) {
  return (jobs || []).filter((job) => {
    const date = jobWorkDate(job)
    if (!date || !start || !end) return false
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)
    const from = new Date(start)
    from.setHours(0, 0, 0, 0)
    const to = new Date(end)
    to.setHours(0, 0, 0, 0)
    return day >= from && day <= to
  })
}
