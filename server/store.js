import { readList, storageLabel, writeList } from './db.js'

function readJobs() {
  return readList('jobs').filter(isJobRecord)
}

function writeJobs(jobs) {
  return writeList('jobs', jobs)
}

function isJobRecord(job) {
  return Boolean(job) && typeof job === 'object' && !Array.isArray(job) && typeof job.id === 'string' && job.id.length > 0
}

export async function replaceAllJobs(jobs) {
  if (!Array.isArray(jobs)) throw invalidError('A jobs list is required.')
  if (!jobs.every(isJobRecord)) throw invalidError('Every job must be a record with an id.')
  await writeJobs(jobs)
  return listJobs()
}

export function jobsFilePath() {
  return storageLabel('jobs')
}

export function listJobs() {
  return readJobs().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function countWeekBookings(week, exceptId) {
  return readJobs().filter(
    (job) => job.week === week && job.status !== 'cancelled' && job.id !== exceptId,
  ).length
}


const STATUSES = new Set(['new', 'confirmed', 'scheduled', 'done', 'paid', 'cancelled'])
const EDITABLE_FIELDS = ['fullName', 'phone', 'whatsapp', 'location', 'service', 'tankType', 'tankSize', 'tanks', 'week', 'time', 'extra', 'status', 'amount', 'notes', 'workerId']

function text(value, max = 2000) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  return String(value).trim().slice(0, max)
}

function parseStatus(value, fallback) {
  const status = text(value)
  if (!status) return fallback
  if (!STATUSES.has(status)) throw invalidError('Unknown job status.')
  return status
}

function parseAmount(value) {
  if (value === '' || value == null) return null
  const amount = Number(value)
  if (Number.isNaN(amount) || !Number.isFinite(amount)) return null
  if (amount < 0) throw invalidError('Amount cannot be negative.')
  return amount
}

function invalidError(message) {
  const error = new Error(message)
  error.code = 'INVALID'
  return error
}

function buildJob(input, now) {
  const fullName = text(input.fullName, 200)
  const phone = text(input.phone, 50)
  if (!fullName) throw invalidError('Name is required.')
  if (!phone) throw invalidError('Phone is required.')

  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    fullName,
    phone,
    whatsapp: text(input.whatsapp, 50),
    location: text(input.location, 200),
    service: text(input.service, 200),
    tankType: text(input.tankType, 100),
    tankSize: text(input.tankSize, 100),
    tanks: text(input.tanks, 10),
    week: text(input.week, 100),
    time: text(input.time, 100),
    extra: text(input.extra),
    status: parseStatus(input.status, 'new'),
    amount: parseAmount(input.amount),
    notes: text(input.notes),
    source: text(input.source, 20) || 'website',
    workerId: text(input.workerId, 100),
  }
}

export async function createJobs(inputs) {
  const existing = readJobs()
  const started = Date.now()
  const created = inputs.map((input, index) => buildJob(input, new Date(started + index).toISOString()))
  await writeJobs([...existing, ...created])
  return created
}

export async function createJob(input) {
  return (await createJobs([input]))[0]
}

export async function updateJob(id, patch) {
  const jobs = readJobs()
  const index = jobs.findIndex((job) => job.id === id)
  if (index === -1) return null

  const current = jobs[index]
  const changes = {}
  for (const key of EDITABLE_FIELDS) {
    if (patch[key] !== undefined) changes[key] = patch[key]
  }

  const next = { ...current, updatedAt: new Date().toISOString() }
  for (const [key, value] of Object.entries(changes)) {
    if (key === 'amount') next.amount = parseAmount(value)
    else if (key === 'status') next.status = parseStatus(value, current.status)
    else next[key] = text(value)
  }
  if (!next.fullName) throw invalidError('Name is required.')
  if (!next.phone) throw invalidError('Phone is required.')

  jobs[index] = next
  await writeJobs(jobs)
  return next
}

export async function deleteJob(id) {
  const jobs = readJobs()
  const next = jobs.filter((job) => job.id !== id)
  if (next.length === jobs.length) return false
  await writeJobs(next)
  return true
}
