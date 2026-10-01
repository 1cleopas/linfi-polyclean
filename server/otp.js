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
  return String(process.env.ADMIN_OTP_EMAIL || 'obbolinus5050@gmail.com').trim()
}

function smtpUser() {
  return String(process.env.SMTP_USER || '').trim()
}

function smtpPass() {
  return String(process.env.SMTP_PASS || '').replace(/\s/g, '')
}

function mailConfigured() {
  return Boolean(smtpUser() && smtpPass())
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

function mailError(message) {
  const error = new Error(message)
  error.code = 'MAIL'
  return error
}

async function deliver(code) {
  const to = recoveryEmail()
  const user = smtpUser()
  const pass = smtpPass()

  if (!user || !pass) {
    if (isLive()) {
      throw mailError('Mail is not set up on the live site. In Render Environment add SMTP_USER and SMTP_PASS, save, then try again.')
    }
    console.log(`Manager sign-in code for ${to}: ${code}`)
    return
  }

  const mail = {
    from: `LINFI POLYCLEAN <${user}>`,
    to,
    subject: 'Manager sign-in code',
    text: `Your LINFI POLYCLEAN manager sign-in code is ${code}.\n\nIt expires in 10 minutes.\n\nIf you did not try to open the dashboard, you can ignore this email.`,
  }

  const setups = [
    {
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
    },
    {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
    },
  ]

  let lastMessage = ''
  for (const options of setups) {
    const transport = nodemailer.createTransport(options)
    try {
      await transport.sendMail(mail)
      transport.close()
      return
    } catch (err) {
      lastMessage = err?.message || String(err)
      try {
        transport.close()
      } catch {
        // Ignore close errors after a failed send.
      }
    }
  }

  console.error('Sign-in email failed:', lastMessage)
  throw mailError('Gmail could not send the sign-in code. Check SMTP_USER and the 16-letter app password (no spaces), then try again.')
}

export async function issueSignInCode() {
  if (!withinSendLimit()) {
    const error = new Error('A code was just sent. Wait a few minutes before asking for another.')
    error.code = 'RATE'
    throw error
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const challengeId = randomBytes(16).toString('base64url')
  challenges.set(challengeId, {
    hash: hashCode(challengeId, code),
    exp: Date.now() + TTL_MS,
    attempts: 0,
  })

  try {
    await deliver(code)
  } catch (error) {
    challenges.delete(challengeId)
    throw error
  }

  sendTimes.push(Date.now())
  return { challengeId }
}

export function checkSignInCode(challengeId, code) {
  const id = String(challengeId || '')
  const item = challenges.get(id)
  if (!id || !item || item.exp < Date.now()) {
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
