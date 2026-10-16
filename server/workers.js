import { readList, storageLabel, writeList } from './db.js'

function readWorkers() {
  return readList('workers')
    .filter((worker) => worker && typeof worker === 'object' && worker.id)
    .map((worker) => normalizeWorker(worker, { strict: false }))
}

function writeWorkers(workers) {
  return writeList('workers', workers)
}

function invalidError(message) {
  const error = new Error(message)
  error.code = 'INVALID'
  return error
}

function parseCommissionPercent(value, strict = true) {
  if (value === '' || value == null) return null
  const rate = Number(value)
  if (Number.isNaN(rate)) {
    if (strict) throw invalidError('Commission must be a number between 0 and 100.')
    return null
  }
  if (rate < 0 || rate > 100) {
    // A bad saved value must not hide every worker, so reads clear it instead of failing.
    if (strict) throw invalidError('Commission must be between 0 and 100 percent.')
    return null
  }
  return rate
}

function normalizeWorker(worker, { strict = true } = {}) {
  return {
    id: worker.id,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
    fullName: String(worker.fullName || '').trim(),
    role: String(worker.role || '').trim(),
    phone: String(worker.phone || '').trim(),
    commissionPercent: parseCommissionPercent(worker.commissionPercent, strict),
    notes: String(worker.notes || '').trim(),
  }
}

function buildWorker(input, now) {
  const fullName = String(input.fullName || '').trim()
  if (!fullName) throw invalidError('Worker name is required.')

  return normalizeWorker({
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    fullName,
    role: input.role,
    phone: input.phone,
    commissionPercent: input.commissionPercent,
    notes: input.notes,
  })
}

export function workersFilePath() {
  return storageLabel('workers')
}

export function listWorkers() {
  return readWorkers().sort((a, b) => String(a.fullName).localeCompare(String(b.fullName)))
}

export async function createWorker(input) {
  const existing = readWorkers()
  const worker = buildWorker(input, new Date().toISOString())
  await writeWorkers([...existing, worker])
  return worker
}

export async function updateWorker(id, patch) {
  const workers = readWorkers()
  const index = workers.findIndex((worker) => worker.id === id)
  if (index === -1) return null

  const current = workers[index]
  if (patch.fullName != null && !String(patch.fullName).trim()) {
    throw invalidError('Worker name is required.')
  }

  const next = normalizeWorker({
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
    fullName: patch.fullName != null ? patch.fullName : current.fullName,
    role: patch.role != null ? patch.role : current.role,
    phone: patch.phone != null ? patch.phone : current.phone,
    notes: patch.notes != null ? patch.notes : current.notes,
    commissionPercent: patch.commissionPercent !== undefined ? patch.commissionPercent : current.commissionPercent,
  })

  workers[index] = next
  await writeWorkers(workers)
  return next
}

export async function deleteWorker(id) {
  const workers = readWorkers()
  const next = workers.filter((worker) => worker.id !== id)
  if (next.length === workers.length) return false
  await writeWorkers(next)
  return true
}
