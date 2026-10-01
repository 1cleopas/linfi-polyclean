import express from 'express'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { join } from 'node:path'
import { checkSignInCode, issueSignInCode } from './otp.js'
import { clientIp, passwordMatches, securityHeaders, tooMany } from './security.js'
import { countWeekBookings, createJob, createJobs, deleteJob, jobsFilePath, listJobs, replaceAllJobs, updateJob } from './store.js'

const app = express()
const adminPassword = process.env.ADMIN_PASSWORD || 'linfi-admin'
const SESSION_MS = 1000 * 60 * 60 * 24 * 14

function signSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS, v: 4 })).toString('base64url')
  const sig = createHmac('sha256', adminPassword).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

function hasValidSession(token) {
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
app.use(securityHeaders)
app.use(express.json({ limit: '200kb' }))

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

app.post('/api/bookings', (req, res) => {
  if (tooMany(`book:${clientIp(req)}`, { max: 8, windowMs: 15 * 60 * 1000 })) {
    res.status(429).json({ error: 'Too many booking attempts. Please wait a few minutes.' })
    return
  }
  const body = req.body || {}
  if (!String(body.fullName || '').trim() || !String(body.phone || '').trim() || !String(body.location || '').trim() || !String(body.week || '').trim()) {
    res.status(400).json({ error: 'Name, phone, location and preferred week are required.' })
    return
  }

  try {
    const requested = Number.parseInt(String(body.tanks || '').trim(), 10)
    const tankCount = Number.isFinite(requested) && requested > 1 ? requested : 1
    if (tankCount > 100) {
      res.status(400).json({ error: 'One booking can include up to 100 tanks.' })
      return
    }

    const sizes = Array.isArray(body.tankSizes) ? body.tankSizes : []
    const jobs = createJobs(
      Array.from({ length: tankCount }, (_, index) => ({
        ...body,
        source: 'website',
        status: 'new',
        tanks: '1',
        tankSize: String(sizes[index] || (tankCount === 1 ? body.tankSize : '') || '').trim(),
        extra: [tankCount > 1 ? `Tank ${index + 1} of ${tankCount}.` : '', body.extra].filter(Boolean).join(' '),
      })),
    )
    console.log(`Booking saved: ${jobs[0].fullName} (${jobs.length} tank${jobs.length === 1 ? '' : 's'}, ${jobs[0].week})`)
    res.status(201).json({
      job: jobs[0],
      jobs,
      weekCount: countWeekBookings(jobs[0].week),
    })
  } catch (error) {
    if (error.code === 'INVALID') {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Could not save this booking.' })
  }
})

app.post('/api/admin/login', async (req, res) => {
  const ip = clientIp(req)
  if (tooMany(`login:${ip}`, { max: 8, windowMs: 15 * 60 * 1000 })) {
    res.status(429).json({ error: 'Too many sign-in attempts. Wait a few minutes and try again.' })
    return
  }
  if (!passwordMatches(req.body?.password, adminPassword)) {
    res.status(401).json({ error: 'Wrong password.' })
    return
  }
  try {
    const { challengeId } = await issueSignInCode()
    res.json({ challengeId })
  } catch (error) {
    res.status(error.code === 'RATE' ? 429 : 503).json({ error: error.message })
  }
})

app.post('/api/admin/login/code', (req, res) => {
  const ip = clientIp(req)
  if (tooMany(`code:${ip}`, { max: 8, windowMs: 15 * 60 * 1000 })) {
    res.status(429).json({ error: 'Too many sign-in attempts. Wait a few minutes and try again.' })
    return
  }
  try {
    checkSignInCode(req.body?.challengeId, req.body?.code)
    res.json({ token: signSession() })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

app.get('/api/admin/jobs', requireAdmin, (_req, res) => {
  res.json({ jobs: listJobs() })
})

app.put('/api/admin/jobs', requireAdmin, (req, res) => {
  try {
    res.json({ jobs: replaceAllJobs(req.body?.jobs) })
  } catch (error) {
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

app.post('/api/admin/jobs', requireAdmin, (req, res) => {
  try {
    const job = createJob({ ...(req.body || {}), source: req.body?.source || 'manual' })
    res.status(201).json({ job })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.patch('/api/admin/jobs/:id', requireAdmin, (req, res) => {
  try {
    const job = updateJob(req.params.id, req.body || {})
    if (!job) {
      res.status(404).json({ error: 'Job not found.' })
      return
    }
    res.json({ job })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.delete('/api/admin/jobs/:id', requireAdmin, (req, res) => {
  if (!deleteJob(req.params.id)) {
    res.status(404).json({ error: 'Job not found.' })
    return
  }
  res.status(204).end()
})

const dist = join(process.cwd(), 'dist')
app.use(express.static(dist))
app.get(/.*/, (_req, res) => {
  res.sendFile(join(dist, 'index.html'))
})

app.listen(port, '0.0.0.0', () => {
  console.log(`LINFI POLYCLEAN server listening on 0.0.0.0:${port}`)
  console.log(`Job file: ${jobsFilePath()}`)
})
