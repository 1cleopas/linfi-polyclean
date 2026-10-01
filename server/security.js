import { createHash, timingSafeEqual } from 'node:crypto'

const buckets = new Map()

export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return forwarded || req.socket?.remoteAddress || 'unknown'
}

export function tooMany(key, { max, windowMs }) {
  const now = Date.now()
  const item = buckets.get(key)
  if (!item || now - item.start > windowMs) {
    buckets.set(key, { start: now, count: 1 })
    return false
  }
  item.count += 1
  return item.count > max
}

export function passwordMatches(given, expected) {
  const left = createHash('sha256').update(String(given || '')).digest()
  const right = createHash('sha256').update(String(expected || '')).digest()
  return timingSafeEqual(left, right)
}

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  next()
}
