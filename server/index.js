import { rootDir } from './loadEnv.js'
import express from 'express'
import { existsSync } from 'node:fs'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { join } from 'node:path'
import { countWeekBookings, createJob, createJobs, deleteJob, jobsFilePath, listJobs, replaceAllJobs, updateJob } from './store.js'
import { initStorage } from './db.js'
import { createWorker, deleteWorker, listWorkers, updateWorker, workersFilePath } from './workers.js'
import { createInvoice, deleteInvoice, invoicesFilePath, listInvoices, updateInvoice } from './invoices.js'
import { notificationStatus, notifyNewBooking } from './notify.js'

const app = express()
const configuredPassword = String(process.env.ADMIN_PASSWORD || '').trim()
const onHost = Boolean(process.env.RENDER || process.env.NODE_ENV === 'production')
// The old fallback password is in the public repo, so it is only allowed for local development.
const adminPassword = configuredPassword || (onHost ? '' : 'linfi-admin')
if (!configuredPassword) {
  console.warn(
    onHost
      ? 'ADMIN_PASSWORD is not set. Manager sign-in is disabled until it is added in the hosting settings.'
      : 'ADMIN_PASSWORD is not set. Using the local development password.',
  )
}
const SESSION_MS = 1000 * 60 * 60 * 24 * 14
const buckets = new Map()

function clientIp(req) {
  // With 'trust proxy' set to 1, req.ip is the address Render's proxy saw, which a visitor cannot fake.
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

const PUBLIC_BOOKING_FIELDS = ['fullName', 'phone', 'whatsapp', 'email', 'location', 'gpsAddress', 'service', 'tankType', 'tankSize', 'week', 'time', 'extra']

function text(value, max = 500) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  return String(value).trim().slice(0, max)
}

function tooMany(key, { max, windowMs }) {
  const now = Date.now()
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now - bucket.start > windowMs) buckets.delete(bucketKey)
    }
  }
  const item = buckets.get(key)
  if (!item || now - item.start > windowMs) {
    buckets.set(key, { start: now, count: 1 })
    return false
  }
  item.count += 1
  return item.count > max
}

function passwordMatches(given, expected) {
  const left = createHash('sha256').update(String(given || '')).digest()
  const right = createHash('sha256').update(String(expected || '')).digest()
  return timingSafeEqual(left, right)
}

function signSession() {
  if (!adminPassword) throw new Error('Manager sign-in is not configured.')
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS, v: 4 })).toString('base64url')
  const sig = createHmac('sha256', adminPassword).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function hasValidSession(token) {
  if (!adminPassword) return false
  const parts = String(token || '').split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const expected = createHmac('sha256', adminPassword).update(payload).digest('base64url')
  const left = Buffer.from(sig)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return data.v === 4 && typeof data.exp === 'number' && data.exp > Date.now()
  } catch {
    return false
  }
}

const port = Number(process.env.PORT) || 3000

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(express.json({ limit: '200kb' }))
app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid request.' })
    return
  }
  next(error)
})

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!hasValidSession(token)) {
    res.status(401).json({ error: 'Please sign in as manager.' })
    return
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/bookings', async (req, res) => {
  if (tooMany(`book:${clientIp(req)}`, { max: 24, windowMs: 15 * 60 * 1000 })) {
    res.status(429).json({ error: 'Too many booking attempts. Please wait a few minutes.' })
    return
  }
  const raw = req.body && typeof req.body === 'object' ? req.body : {}
  // Spam trap: people never see the "website" field, so anything in it came from a bot.
  // Answer as if it worked so the bot learns nothing, but save and send nothing.
  if (text(raw.website)) {
    console.warn(`Booking spam trap triggered from ${clientIp(req)}`)
    res.status(201).json({ job: null, jobs: [], weekCount: 0, confirmations: [] })
    return
  }
  // Only accept fields a customer is allowed to set. Price, notes, status and worker stay manager-only.
  const body = Object.fromEntries(PUBLIC_BOOKING_FIELDS.map((key) => [key, text(raw[key], key === 'extra' ? 2000 : 200)]))
  if (!body.fullName || !body.phone || !body.location || !body.week) {
    res.status(400).json({ error: 'Name, phone, location and preferred week are required.' })
    return
  }
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    res.status(400).json({ error: 'Enter a valid email or leave it blank.' })
    return
  }

  try {
    const requested = Number.parseInt(text(raw.tanks), 10)
    const tankCount = Number.isFinite(requested) && requested > 1 ? requested : 1
    if (tankCount > 100) {
      res.status(400).json({ error: 'One booking can include up to 100 tanks.' })
      return
    }

    const sizes = Array.isArray(raw.tankSizes) ? raw.tankSizes.map((size) => text(size, 100)) : []
    const jobs = await createJobs(
      Array.from({ length: tankCount }, (_, index) => ({
        ...body,
        source: 'website',
        status: 'new',
        tanks: '1',
        tankSize: sizes[index] || (tankCount === 1 ? body.tankSize : ''),
        extra: [tankCount > 1 ? `Tank ${index + 1} of ${tankCount}.` : '', body.extra].filter(Boolean).join(' '),
      })),
    )
    console.log(`Booking saved: ${jobs[0].fullName} (${jobs.length} tank${jobs.length === 1 ? '' : 's'}, ${jobs[0].week})`)
    // Sent in the background so a slow email or SMS service never holds up the customer.
    const confirmations = notifyNewBooking(jobs, { via: 'on the website' })
    res.status(201).json({
      job: jobs[0],
      jobs,
      weekCount: countWeekBookings(jobs[0].week),
      confirmations,
    })
  } catch (error) {
    if (error.code === 'INVALID') {
      res.status(400).json({ error: error.message })
      return
    }
    console.error(error)
    res.status(500).json({ error: 'Could not save this booking.' })
  }
})

const formSecret = String(process.env.FORM_WEBHOOK_SECRET || '').trim()

// Bookings sent by the Google Form's script. Protected by a shared secret, and safe to retry:
// a response that was already saved is recognised by its id and not saved again.
app.post('/api/integrations/google-form', async (req, res) => {
  if (!formSecret) {
    res.status(503).json({ error: 'Google Form bookings are not set up on the server.' })
    return
  }
  if (!passwordMatches(String(req.headers['x-form-secret'] || ''), formSecret)) {
    res.status(401).json({ error: 'Not allowed.' })
    return
  }
  const raw = req.body && typeof req.body === 'object' ? req.body : {}
  const responseId = text(raw.responseId, 200)
  const fullName = text(raw.fullName, 200)
  const phone = text(raw.phone, 50)
  if (!responseId || !fullName || !phone) {
    res.status(400).json({ error: 'Response id, name and phone are required.' })
    return
  }

  const existing = listJobs().filter((job) => job.formResponseId === responseId)
  if (existing.length) {
    res.json({ duplicate: true, jobs: existing })
    return
  }

  const requested = Number.parseInt(text(raw.tanks), 10)
  const tankCount = Math.min(Number.isFinite(requested) && requested > 1 ? requested : 1, 100)
  const location = text(raw.location, 200)
  const gpsAddress = text(raw.digitalAddress, 50)
  const notes = [
    raw.lastCleaned ? `Last cleaned: ${text(raw.lastCleaned, 100)}.` : '',
    text(raw.extra, 2000),
  ].filter(Boolean).join(' ')

  try {
    const jobs = await createJobs(
      Array.from({ length: tankCount }, (_, index) => ({
        fullName,
        phone,
        whatsapp: text(raw.whatsapp, 50),
        email: text(raw.email, 200),
        location,
        gpsAddress,
        service: text(raw.service, 200),
        tankType: text(raw.tankType, 100),
        tankSize: text(raw.tankSize, 100),
        tanks: '1',
        week: text(raw.week, 100),
        time: text(raw.time, 100),
        extra: [tankCount > 1 ? `Tank ${index + 1} of ${tankCount}.` : '', notes].filter(Boolean).join(' '),
        status: 'new',
        source: 'google-form',
        formResponseId: responseId,
      })),
    )
    console.log(`Google Form booking saved: ${fullName} (${jobs.length} tank${jobs.length === 1 ? '' : 's'}, ${jobs[0].week})`)
    notifyNewBooking(jobs, { via: 'through the Google Form' })
    res.status(201).json({ jobs })
  } catch (error) {
    if (error.code === 'INVALID') {
      res.status(400).json({ error: error.message })
      return
    }
    throw error
  }
})

app.post('/api/admin/login', (req, res) => {
  const ip = clientIp(req)
  if (!adminPassword) {
    res.status(503).json({ error: 'Manager sign-in is not set up yet. Add ADMIN_PASSWORD in the hosting settings.' })
    return
  }
  if (!passwordMatches(String(req.body?.password || '').trim(), adminPassword)) {
    if (tooMany(`login:${ip}`, { max: 8, windowMs: 15 * 60 * 1000 })) {
      res.status(429).json({ error: 'Too many sign-in attempts. Wait a few minutes and try again.' })
      return
    }
    res.status(401).json({ error: 'Wrong password.' })
    return
  }
  res.json({ token: signSession() })
})

app.get('/api/admin/jobs', requireAdmin, (_req, res) => {
  res.json({ jobs: listJobs() })
})

app.put('/api/admin/jobs', requireAdmin, async (req, res) => {
  try {
    res.json({ jobs: await replaceAllJobs(req.body?.jobs) })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.get('/api/admin/jobs/:id', requireAdmin, (req, res) => {
  const job = listJobs().find((item) => item.id === req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found.' })
    return
  }
  res.json({ job })
})

app.post('/api/admin/jobs', requireAdmin, async (req, res) => {
  try {
    const job = await createJob({ ...(req.body || {}), source: req.body?.source || 'manual' })
    res.status(201).json({ job })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.patch('/api/admin/jobs/:id', requireAdmin, async (req, res) => {
  try {
    const job = await updateJob(req.params.id, req.body || {})
    if (!job) {
      res.status(404).json({ error: 'Job not found.' })
      return
    }
    res.json({ job })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/admin/jobs/:id', requireAdmin, async (req, res) => {
  if (!(await deleteJob(req.params.id))) {
    res.status(404).json({ error: 'Job not found.' })
    return
  }
  res.status(204).end()
})

app.get('/api/admin/workers', requireAdmin, (_req, res) => {
  res.json({ workers: listWorkers() })
})

app.post('/api/admin/workers', requireAdmin, async (req, res) => {
  try {
    const worker = await createWorker(req.body || {})
    res.status(201).json({ worker })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.patch('/api/admin/workers/:id', requireAdmin, async (req, res) => {
  try {
    const worker = await updateWorker(req.params.id, req.body || {})
    if (!worker) {
      res.status(404).json({ error: 'Worker not found.' })
      return
    }
    res.json({ worker })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/admin/workers/:id', requireAdmin, async (req, res) => {
  if (!(await deleteWorker(req.params.id))) {
    res.status(404).json({ error: 'Worker not found.' })
    return
  }
  res.status(204).end()
})

app.get('/api/admin/invoices', requireAdmin, (_req, res) => {
  res.json({ invoices: listInvoices() })
})

app.post('/api/admin/invoices', requireAdmin, async (req, res) => {
  try {
    const invoice = await createInvoice(req.body || {})
    res.status(201).json({ invoice })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.patch('/api/admin/invoices/:id', requireAdmin, async (req, res) => {
  try {
    const invoice = await updateInvoice(req.params.id, req.body || {})
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found.' })
      return
    }
    res.json({ invoice })
  } catch (error) {
    if (error.code !== 'INVALID') throw error
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/admin/invoices/:id', requireAdmin, async (req, res) => {
  if (!(await deleteInvoice(req.params.id))) {
    res.status(404).json({ error: 'Invoice not found.' })
    return
  }
  res.status(204).end()
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found.' })
})

const dist = join(rootDir, 'dist')
const indexFile = join(dist, 'index.html')
if (existsSync(indexFile)) {
  app.use(express.static(dist))
  app.get(/.*/, (_req, res) => {
    res.sendFile(indexFile)
  })
}

app.use((error, _req, res, _next) => {
  console.error(error)
  if (res.headersSent) return
  res.status(500).json({ error: 'Something went wrong on the server. Please try again.' })
})

await initStorage()

app.listen(port, '0.0.0.0', () => {
  console.log(`LINFI POLYCLEAN server listening on 0.0.0.0:${port}`)
  console.log(`Job file: ${jobsFilePath()}`)
  console.log(`Worker file: ${workersFilePath()}`)
  console.log(`Invoice file: ${invoicesFilePath()}`)
  console.log(`Booking notifications: ${notificationStatus()}`)
})
