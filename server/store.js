import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { WEEKLY_BOOKING_LIMIT } from '../src/lib/weeks.js'

const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data')
const filePath = join(dataDir, 'jobs.json')

function ensureFile() {
  mkdirSync(dirname(filePath), { recursive: true })
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf8')
  }
}

function readJobs() {
  ensureFile()
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJobs(jobs) {
  ensureFile()
  writeFileSync(filePath, JSON.stringify(jobs, null, 2), 'utf8')
}

export function listJobs() {
  return readJobs().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function countWeekBookings(week, exceptId) {
  return readJobs().filter(
    (job) => job.week === week && job.status !== 'cancelled' && job.id !== exceptId,
  ).length
}

export function createJob(input) {
  const jobs = readJobs()
  const week = String(input.week || '').trim()
  if (week && countWeekBookings(week) >= WEEKLY_BOOKING_LIMIT) {
    const error = new Error(`This week already has ${WEEKLY_BOOKING_LIMIT} bookings.`)
    error.code = 'WEEK_FULL'
    throw error
  }

  const now = new Date().toISOString()
  const job = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    fullName: String(input.fullName || '').trim(),
    phone: String(input.phone || '').trim(),
    whatsapp: String(input.whatsapp || '').trim(),
    location: String(input.location || '').trim(),
    service: String(input.service || '').trim(),
    tankType: String(input.tankType || '').trim(),
    tankSize: String(input.tankSize || '').trim(),
    tanks: String(input.tanks || '').trim(),
    week,
    time: String(input.time || '').trim(),
    extra: String(input.extra || '').trim(),
    status: input.status || 'new',
    amount: input.amount === '' || input.amount == null ? null : Number(input.amount),
    notes: String(input.notes || '').trim(),
    source: input.source || 'website',
  }

  if (Number.isNaN(job.amount)) job.amount = null
  jobs.push(job)
  writeJobs(jobs)
  return job
}

export function updateJob(id, patch) {
  const jobs = readJobs()
  const index = jobs.findIndex((job) => job.id === id)
  if (index === -1) return null

  const current = jobs[index]
  const nextWeek = patch.week != null ? String(patch.week).trim() : current.week
  if (nextWeek && nextWeek !== current.week && countWeekBookings(nextWeek, id) >= WEEKLY_BOOKING_LIMIT) {
    const error = new Error(`This week already has ${WEEKLY_BOOKING_LIMIT} bookings.`)
    error.code = 'WEEK_FULL'
    throw error
  }

  const next = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  }

  if (patch.amount !== undefined) {
    next.amount = patch.amount === '' || patch.amount == null ? null : Number(patch.amount)
    if (Number.isNaN(next.amount)) next.amount = null
  }

  jobs[index] = next
  writeJobs(jobs)
  return next
}

export function deleteJob(id) {
  const jobs = readJobs()
  const next = jobs.filter((job) => job.id !== id)
  if (next.length === jobs.length) return false
  writeJobs(next)
  return true
}
