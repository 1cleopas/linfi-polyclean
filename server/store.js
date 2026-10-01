import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

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

export function replaceAllJobs(jobs) {
  if (!Array.isArray(jobs)) throw invalidError('A jobs list is required.')
  writeJobs(jobs)
  return listJobs()
}

export function jobsFilePath() {
  return filePath
}

export function listJobs() {
  return readJobs().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function countWeekBookings(week, exceptId) {
  return readJobs().filter(
    (job) => job.week === week && job.status !== 'cancelled' && job.id !== exceptId,
  ).length
}


function invalidError(message) {
  const error = new Error(message)
  error.code = 'INVALID'
  return error
}

function buildJob(input, now) {
  const week = String(input.week || '').trim()
  const status = input.status || 'new'
  if (!String(input.fullName || '').trim()) throw invalidError('Name is required.')
  if (!String(input.phone || '').trim()) throw invalidError('Phone is required.')

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
    status,
    amount: input.amount === '' || input.amount == null ? null : Number(input.amount),
    notes: String(input.notes || '').trim(),
    source: input.source || 'website',
  }

  if (Number.isNaN(job.amount)) job.amount = null
  return job
}

export function createJobs(inputs) {
  const existing = readJobs()
  const now = new Date().toISOString()
  const created = inputs.map((input) => buildJob(input, now))
  writeJobs([...existing, ...created])
  return created
}

export function createJob(input) {
  return createJobs([input])[0]
}

export function updateJob(id, patch) {
  const jobs = readJobs()
  const index = jobs.findIndex((job) => job.id === id)
  if (index === -1) return null

  const current = jobs[index]
  const nextWeek = patch.week != null ? String(patch.week).trim() : current.week
  const nextStatus = patch.status != null ? patch.status : current.status
  if (patch.fullName != null && !String(patch.fullName).trim()) {
    const error = new Error('Name is required.')
    error.code = 'INVALID'
    throw error
  }
  if (patch.phone != null && !String(patch.phone).trim()) {
    const error = new Error('Phone is required.')
    error.code = 'INVALID'
    throw error
  }

  const next = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  }

  next.week = nextWeek
  next.status = nextStatus
  if (patch.fullName != null) next.fullName = String(patch.fullName).trim()
  if (patch.phone != null) next.phone = String(patch.phone).trim()

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
