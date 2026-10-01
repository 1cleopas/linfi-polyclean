import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import nodemailer from 'nodemailer'

const TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_SENDS = 5
const SEND_WINDOW_MS = 15 * 60 * 1000

const challenges = new Map()
const sendTimes = []
let transport

function secret() {
  return process.env.ADMIN_PASSWORD || 'linfi-admin'
}

function recoveryEmail() {
  return process.env.ADMIN_OTP_EMAIL || 'obbolinus5050@gmail.com'
}

function smtpPass() {
  return String(process.env.SMTP_PASS || '').replace(/\s/g, '')
}

function mailConfigured() {
  return Boolean(process.env.SMTP_USER && smtpPass())
}

function isLive() {
  return process.env.NODE_ENV === 'production' || process.env.RENDER === 'true'
}

function hashCode(challengeId, code) {
  return createHmac('sha256', secret()).update(`${challengeId}:${code}`).digest()
}

function withinSendLimit() {
  const now = Date.now()
  while (sendTimes.length && now - sendTimes[0] > SEND_WINDOW_MS) sendTimes.shift()
  return sendTimes.length < MAX_SENDS
}

function getTransport() {
  if (transport) return transport
  const port = Number(process.env.SMTP_PORT || 465)
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 1,
    auth: { user: process.env.SMTP_USER, pass: smtpPass() },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  })
  return transport
}

export function issueSignInCode() {
  if (!withinSendLimit()) {
    const error = new Error('A code was just sent. Wait a few minutes before asking for another.')
    error.code = 'RATE'
    throw error
  }
  if (!mailConfigured() && isLive()) {
    const error = new Error('The sign-in code could not be sent.')
    error.code = 'MAIL'
    throw error
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const challengeId = randomBytes(16).toString('base64url')
  sendTimes.push(Date.now())
  challenges.set(challengeId, {
    hash: hashCode(challengeId, code),
    exp: Date.now() + TTL_MS,
    attempts: 0,
  })

  if (!mailConfigured()) {
    console.log(`Manager sign-in code for ${recoveryEmail()}: ${code}`)
    return { challengeId }
  }

  getTransport()
    .sendMail({
      from: `LINFI POLYCLEAN <${process.env.SMTP_USER}>`,
      to: recoveryEmail(),
      subject: 'Manager sign-in code',
      text: `Your LINFI POLYCLEAN manager sign-in code is ${code}.\n\nIt expires in 10 minutes.\n\nIf you did not try to open the dashboard, you can ignore this email.`,
    })
    .catch((err) => {
      console.error('Sign-in email failed:', err.message)
    })

  return { challengeId }
}

export function checkSignInCode(challengeId, code) {
  const id = String(challengeId || '')
  const item = challenges.get(id)
  if (!item || item.exp < Date.now()) {
    challenges.delete(id)
    const error = new Error('That code has expired. Enter the password again to get a new one.')
    error.code = 'EXPIRED'
    throw error
  }
  item.attempts += 1
  const given = String(code || '').replace(/\D/g, '')
  const same = given.length === 6 && timingSafeEqual(hashCode(id, given), item.hash)
  if (!same) {
    const locked = item.attempts >= MAX_ATTEMPTS
    if (locked) challenges.delete(id)
    const error = new Error(locked ? 'Too many tries. Enter the password again to get a new code.' : 'That code is not correct.')
    error.code = 'INVALID'
    throw error
  }
  challenges.delete(id)
}
