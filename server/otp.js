import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

const TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5
const MAX_SENDS = 5
const SEND_WINDOW_MS = 15 * 60 * 1000

const challenges = new Map()
const sendTimes = []

function secret() {
  return process.env.ADMIN_PASSWORD || 'linfi-admin'
}

function recoveryPhone() {
  return toE164(process.env.ADMIN_OTP_PHONE || '0241915966')
}

function toE164(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0') && digits.length === 10) digits = `233${digits.slice(1)}`
  if (digits.length === 9) digits = `233${digits}`
  return digits
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

function smsError(message) {
  const error = new Error(message)
  error.code = 'MAIL'
  return error
}

function africaTalkingConfigured() {
  return Boolean(process.env.AFRICASTALKING_USERNAME && process.env.AFRICASTALKING_API_KEY)
}

function smsConfigured() {
  return africaTalkingConfigured()
}

async function sendAfricaTalking(to, text) {
  const username = String(process.env.AFRICASTALKING_USERNAME || '').trim()
  const apiKey = String(process.env.AFRICASTALKING_API_KEY || '').trim()
  const from = String(process.env.AFRICASTALKING_FROM || '').trim()
  const sandbox = String(process.env.AFRICASTALKING_SANDBOX || '').toLowerCase() === 'true'
  const host = sandbox ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com'
  const body = new URLSearchParams({
    username,
    to: `+${to}`,
    message: text,
  })
  if (from) body.set('from', from)
  const response = await fetch(`${host}/version1/messaging`, {
    method: 'POST',
    headers: {
      apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const data = await response.json().catch(() => ({}))
  const recipients = data.SMSMessageData?.Recipients
  const delivered = Array.isArray(recipients) && recipients.some((item) => {
    const code = Number(item.statusCode)
    return item.status === 'Success' || (code >= 100 && code < 200)
  })
  if (!response.ok || !delivered) {
    const reason = recipients?.[0]?.status || data.SMSMessageData?.Message || `Africa's Talking ${response.status}`
    throw new Error(reason)
  }
}

async function deliver(code) {
  const to = recoveryPhone()
  if (!to || to.length < 10) {
    throw smsError('The manager phone number is not set. Add ADMIN_OTP_PHONE on the server.')
  }

  const text = `LINFI POLYCLEAN manager sign-in code: ${code}. It expires in 10 minutes.`

  if (!smsConfigured()) {
    if (isLive()) {
      throw smsError('Text messages are not set up on the live site. Add AFRICASTALKING_USERNAME and AFRICASTALKING_API_KEY, then try again.')
    }
    console.log(`Manager sign-in code for +${to}: ${code}`)
    return
  }

  try {
    await sendAfricaTalking(to, text)
  } catch (err) {
    console.error('Sign-in SMS failed:', err.message)
    throw smsError('The sign-in code could not be sent to the phone. Check the Africa\'s Talking settings and try again.')
  }
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
