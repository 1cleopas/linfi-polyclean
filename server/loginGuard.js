import { readList, writeList } from './db.js'

/*
  Limits on wrong manager passwords. Counts are saved with the rest of the data, so a server
  restart (which the free Render plan does often) does not hand an attacker fresh guesses.

  - One address: 8 wrong passwords in 15 minutes.
  - Everyone together: 40 wrong passwords in an hour, so guessing from many addresses at once
    also stops. While that limit is hit the manager has to wait too.
*/

const LIMITS = [
  { scope: 'ip', max: 8, windowMs: 15 * 60 * 1000 },
  { scope: 'all', max: 40, windowMs: 60 * 60 * 1000 },
]

function keysFor(ip) {
  return LIMITS.map((limit) => ({ ...limit, key: limit.scope === 'ip' ? `ip:${ip}` : 'all' }))
}

function liveEntries(now = Date.now()) {
  const windowFor = Object.fromEntries(LIMITS.map((limit) => [limit.scope, limit.windowMs]))
  return readList('loginFailures').filter(
    (entry) => entry && typeof entry.key === 'string' && now - entry.start < (windowFor[entry.scope] || 0),
  )
}

export function loginBlocked(ip) {
  const entries = liveEntries()
  return keysFor(ip).some(({ key, max }) => (entries.find((entry) => entry.key === key)?.count || 0) >= max)
}

export async function recordLoginFailure(ip) {
  const now = Date.now()
  const entries = liveEntries(now)
  for (const { key, scope } of keysFor(ip)) {
    const entry = entries.find((item) => item.key === key)
    if (entry) entry.count += 1
    else entries.push({ key, scope, start: now, count: 1 })
  }
  await writeList('loginFailures', entries)
}

export async function clearLoginFailures(ip) {
  const entries = readList('loginFailures')
  const kept = entries.filter((entry) => entry?.key !== `ip:${ip}`)
  if (kept.length !== entries.length) await writeList('loginFailures', kept)
}
