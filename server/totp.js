import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const FILE = join(process.env.DATA_DIR || join(process.cwd(), 'data'), 'totp.json')
const challenges = new Map()
const TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

function base32Encode(bytes) {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31]
  return out
}

function base32Decode(secret) {
  const clean = String(secret || '').toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const out = []
  for (const char of clean) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function hotp(secret, step) {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(step))
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3]
  return String(binary % 1_000_000).padStart(6, '0')
}

export function verifyCode(secret, code) {
  const given = String(code || '').replace(/\D/g, '')
  if (given.length !== 6) return false
  const now = Math.floor(Date.now() / 1000 / 30)
  const left = Buffer.from(given)
  for (const step of [now - 1, now, now + 1]) {
    const right = Buffer.from(hotp(secret, step))
    if (left.length === right.length && timingSafeEqual(left, right)) return true
  }
  return false
}

export function loadSecret() {
  try {
    if (!existsSync(FILE)) return ''
    const data = JSON.parse(readFileSync(FILE, 'utf8'))
    return String(data.secret || '')
  } catch {
    return ''
  }
}

export function saveSecret(secret) {
  mkdirSync(dirname(FILE), { recursive: true })
  writeFileSync(FILE, JSON.stringify({ secret, createdAt: new Date().toISOString() }), 'utf8')
}

export function createChallenge(kind) {
  const id = randomBytes(16).toString('base64url')
  const secret = kind === 'setup' ? base32Encode(randomBytes(20)) : loadSecret()
  if (kind === 'login' && !secret) return null
  challenges.set(id, { kind, secret, exp: Date.now() + TTL_MS, attempts: 0 })
  return { challengeId: id, secret: kind === 'setup' ? secret : undefined }
}

export function completeChallenge(challengeId, code) {
  const id = String(challengeId || '')
  const item = challenges.get(id)
  if (!item || item.exp < Date.now()) {
    challenges.delete(id)
    const error = new Error('That code has expired. Enter the password again.')
    error.code = 'EXPIRED'
    throw error
  }
  item.attempts += 1
  if (!verifyCode(item.secret, code)) {
    if (item.attempts >= MAX_ATTEMPTS) challenges.delete(id)
    const error = new Error(
      item.attempts >= MAX_ATTEMPTS
        ? 'Too many tries. Enter the password again.'
        : 'That code is not correct.',
    )
    error.code = 'INVALID'
    throw error
  }
  if (item.kind === 'setup') saveSecret(item.secret)
  challenges.delete(id)
}

export function currentCode(secret) {
  return hotp(String(secret || '').replace(/[^A-Z2-7]/gi, ''), Math.floor(Date.now() / 1000 / 30))
}

export function groupedSecret(secret) {
  return String(secret || '')
    .replace(/(.{4})/g, '$1 ')
    .trim()
}
