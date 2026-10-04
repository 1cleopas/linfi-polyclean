import './loadEnv.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const dataDir = process.env.DATA_DIR || join(rootDir, 'data')
const filePath = join(dataDir, 'workers.json')

function ensureFile() {
  mkdirSync(dirname(filePath), { recursive: true })
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf8')
  }
}

function readWorkers() {
  ensureFile()
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    return Array.isArray(parsed) ? parsed.map(normalizeWorker) : []
  } catch {
    return []
  }
}

function writeWorkers(workers) {
  mkdirSync(dirname(filePath), { recursive: true })
  const payload = JSON.stringify(workers, null, 2)
  const tmp = `${filePath}.${process.pid}.tmp`
  writeFileSync(tmp, payload, 'utf8')
  try {
    renameSync(tmp, filePath)
  } catch {
    writeFileSync(filePath, payload, 'utf8')
    try {
      unlinkSync(tmp)
    } catch {
      // The temp file can remain if Windows still has it open.
    }
  }
}

function invalidError(message) {
  const error = new Error(message)
  error.code = 'INVALID'
  return error
}

function parseCommissionPercent(value) {
  if (value === '' || value == null) return null
  const rate = Number(value)
  if (Number.isNaN(rate)) return null
  if (rate < 0 || rate > 100) throw invalidError('Commission must be between 0 and 100 percent.')
  return rate
}

function normalizeWorker(worker) {
  return {
    id: worker.id,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
    fullName: String(worker.fullName || '').trim(),
    role: String(worker.role || '').trim(),
    phone: String(worker.phone || '').trim(),
    commissionPercent: parseCommissionPercent(worker.commissionPercent),
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
  return filePath
}

export function listWorkers() {
  return readWorkers().sort((a, b) => String(a.fullName).localeCompare(String(b.fullName)))
}

export function createWorker(input) {
  const existing = readWorkers()
  const worker = buildWorker(input, new Date().toISOString())
  writeWorkers([...existing, worker])
  return worker
}

export function updateWorker(id, patch) {
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
  writeWorkers(workers)
  return next
}

export function deleteWorker(id) {
  const workers = readWorkers()
  const next = workers.filter((worker) => worker.id !== id)
  if (next.length === workers.length) return false
  writeWorkers(next)
  return true
}
