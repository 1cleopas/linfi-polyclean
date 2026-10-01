import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import nodemailer from 'nodemailer'

const TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_SENDS = 5
const SEND_WINDOW_MS = 15 * 60 * 1000

const challenges = new Map()
const sendTimes = []

function secret() {
  return process.env.ADMIN_PASSWORD || 'linfi-admin'
}

function recoveryEmail() {
  return process.env.ADMIN_OTP_EMAIL || 'obbolinus5050@gmail.com'
}

function hashCode(challengeId, code) {
  return createHmac('sha256', secret()).update(`${challengeId}:${code}`).digest()
}

function withinSendLimit() {
  const now = Date.now()
  while (sendTimes.length && now - sendTimes[0] > SEND_WINDOW_MS) sendTimes.shift()
  return sendTimes.length < MAX_SENDS
}

export async function issueSignInCode() {
  if (!withinSendLimit()) {
    const error = new Error('A code was just sent. Wait a few minutes before asking for another.')
    error.code = 'RATE'
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
  try {
    await deliver(code)
  } catch (error) {
    sendTimes.pop()
    challenges.delete(challengeId)
    throw error
  }
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

async function deliver(code) {
  const to = recoveryEmail()
  const user = process.env.SMTP_USER
  const pass = String(process.env.SMTP_PASS || '').replace(/\s/g, '')
  if (!user || !pass) {
    if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
      const error = new Error('The sign-in code could not be sent.')
      error.code = 'MAIL'
      throw error
    }
    console.log(`Manager sign-in code for ${to}: ${code}`)
    return
  }

  const port = Number(process.env.SMTP_PORT || 465)
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  try {
    await transport.sendMail({
      from: `LINFI POLYCLEAN <${user}>`,
      to,
      subject: 'Manager sign-in code',
      text: `Your LINFI POLYCLEAN manager sign-in code is ${code}.\n\nIt expires in 10 minutes.\n\nIf you did not try to open the dashboard, you can ignore this email.`,
    })
  } catch {
    const error = new Error('The sign-in code could not be sent. Try again in a moment.')
    error.code = 'MAIL'
    throw error
  }
}
