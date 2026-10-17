import './loadEnv.js'
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
  Storage for jobs, workers and invoices.

  - With DATABASE_URL set (for example a free Neon Postgres database), data lives in the
    database and survives restarts, sleeps and redeploys.
  - Without it, data is kept in JSON files under DATA_DIR (or ./data) — fine for local work,
    but wiped on hosts without a persistent disk.

  Lists are held in memory and every change is written through before the request finishes.
*/

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const dataDir = process.env.DATA_DIR || join(rootDir, 'data')
const databaseUrl = String(process.env.DATABASE_URL || '').trim()
const NAMES = ['jobs', 'workers', 'invoices']

const cache = new Map()
let pool = null
let queue = Promise.resolve()

function filePath(name) {
  return join(dataDir, `${name}.json`)
}

function readFile(name) {
  const path = filePath(name)
  if (!existsSync(path)) return []
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeFile(name, list) {
  mkdirSync(dataDir, { recursive: true })
  const path = filePath(name)
  const payload = JSON.stringify(list, null, 2)
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, payload, 'utf8')
  try {
    renameSync(tmp, path)
  } catch {
    writeFileSync(path, payload, 'utf8')
    try {
      unlinkSync(tmp)
    } catch {
      // The temp file can remain if Windows still has it open.
    }
  }
}

export async function initStorage() {
  if (!databaseUrl) {
    for (const name of NAMES) cache.set(name, readFile(name))
    return
  }

  const { default: pg } = await import('pg')
  const local = /localhost|127\.0\.0\.1/.test(databaseUrl)
  pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: local ? false : { rejectUnauthorized: false },
    max: 3,
  })
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (
      name TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  const { rows } = await pool.query('SELECT name, data FROM app_data WHERE name = ANY($1)', [NAMES])
  for (const name of NAMES) {
    const row = rows.find((item) => item.name === name)
    if (row) {
      cache.set(name, Array.isArray(row.data) ? row.data : [])
      continue
    }
    // First run against a new database: carry over anything still in the local files.
    const seed = readFile(name)
    cache.set(name, seed)
    await persist(name, seed)
  }
}

function persist(name, list) {
  if (!pool) {
    writeFile(name, list)
    return Promise.resolve()
  }
  const payload = JSON.stringify(list)
  const run = () =>
    pool.query(
      `INSERT INTO app_data (name, data, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
      [name, payload],
    )
  // Writes go out one at a time so an older save can never land after a newer one.
  queue = queue.then(run, run)
  return queue
}

export function readList(name) {
  return structuredClone(cache.get(name) || [])
}

export async function writeList(name, list) {
  const previous = cache.get(name) || []
  cache.set(name, structuredClone(list))
  try {
    await persist(name, list)
  } catch (error) {
    cache.set(name, previous)
    throw error
  }
}

export function storageLabel(name) {
  return pool ? `Postgres (app_data.${name})` : filePath(name)
}
