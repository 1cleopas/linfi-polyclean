import express from 'express'
import { join } from 'node:path'
import { countWeekBookings, createJob, deleteJob, listJobs, updateJob } from './store.js'
import { WEEKLY_BOOKING_LIMIT } from '../src/lib/weeks.js'

const app = express()
const tokens = new Set()
const adminPassword = process.env.ADMIN_PASSWORD || 'linfi-admin'
const port = Number(process.env.PORT) || 3000

app.use(express.json({ limit: '200kb' }))

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token || !tokens.has(token)) {
    res.status(401).json({ error: 'Please sign in as manager.' })
    return
  }
  next()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/bookings', (req, res) => {
  const body = req.body || {}
  if (!String(body.fullName || '').trim() || !String(body.phone || '').trim() || !String(body.location || '').trim() || !String(body.week || '').trim()) {
    res.status(400).json({ error: 'Name, phone, location and preferred week are required.' })
    return
  }

  try {
    const job = createJob({ ...body, source: 'website', status: 'new' })
    res.status(201).json({
      job,
      weekCount: countWeekBookings(job.week),
      weekLimit: WEEKLY_BOOKING_LIMIT,
    })
  } catch (error) {
    if (error.code === 'WEEK_FULL') {
      res.status(409).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Could not save this booking.' })
  }
})

app.post('/api/admin/login', (req, res) => {
  if (String(req.body?.password || '') !== adminPassword) {
    res.status(401).json({ error: 'Wrong password.' })
    return
  }
  const token = crypto.randomUUID()
  tokens.add(token)
  res.json({ token })
})

app.get('/api/admin/jobs', requireAdmin, (_req, res) => {
  res.json({ jobs: listJobs(), weekLimit: WEEKLY_BOOKING_LIMIT })
})

app.post('/api/admin/jobs', requireAdmin, (req, res) => {
  try {
    const job = createJob({ ...(req.body || {}), source: req.body?.source || 'manual' })
    res.status(201).json({ job })
  } catch (error) {
    res.status(error.code === 'WEEK_FULL' ? 409 : 400).json({ error: error.message })
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
    res.status(error.code === 'WEEK_FULL' ? 409 : 400).json({ error: error.message })
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
})
