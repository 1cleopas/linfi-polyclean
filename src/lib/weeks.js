export const WORK_DAYS = 'Tuesday to Sunday'

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function atMidnight(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDay(date) {
  return `${WEEKDAY_SHORT[date.getDay()]} ${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`
}

const MONTH_INDEX = Object.fromEntries(MONTH_SHORT.map((month, index) => [month, index]))

/** First day of the booked work week, for example Tue 29 Sep 2026. */
export function firstCleaningDate(weekLabel) {
  const match = String(weekLabel || '').match(/[A-Za-z]{3}\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (!match) return null
  const month = MONTH_INDEX[match[2]]
  if (month == null) return null
  const date = new Date(Number(match[3]), month, Number(match[1]))
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month) return null
  return date
}

/** Three months after the first cleaning day. */
export function nextCleaningDate(weekLabel) {
  const first = firstCleaningDate(weekLabel)
  if (!first) return null
  const next = new Date(first)
  next.setMonth(next.getMonth() + 3)
  return next
}

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Work week runs Tuesday through Sunday. Monday is the off day. */
export function startOfWorkWeek(from = new Date()) {
  const today = atMidnight(from)
  const day = today.getDay()

  if (day === 1) {
    return addDays(today, 1)
  }

  const daysSinceTuesday = day === 0 ? 5 : day - 2
  return addDays(today, -daysSinceTuesday)
}

export function workWeeksForMonths(months = 3) {
  const end = atMidnight(new Date())
  end.setMonth(end.getMonth() + months)
  let tuesday = startOfWorkWeek()
  const weeks = []

  while (tuesday <= end) {
    const sunday = addDays(tuesday, 5)
    weeks.push({
      value: isoDate(tuesday),
      label: `${formatDay(tuesday)} – ${formatDay(sunday)}`,
    })
    tuesday = addDays(tuesday, 7)
  }

  return weeks
}

/** Two-week pay period, aligned to the Tuesday work week. */
const FORTNIGHT_EPOCH = atMidnight(new Date(2026, 0, 6))

export function startOfFortnight(from = new Date()) {
  const weekStart = startOfWorkWeek(from)
  const days = Math.round((weekStart.getTime() - FORTNIGHT_EPOCH.getTime()) / 86400000)
  const offset = ((days % 14) + 14) % 14
  return addDays(weekStart, -offset)
}

export function fortnightBounds(from = new Date()) {
  const start = startOfFortnight(from)
  const end = addDays(start, 13)
  return {
    start,
    end,
    value: isoDate(start),
    label: `${formatDay(start)} – ${formatDay(end)}`,
  }
}

export function recentFortnights(count = 6) {
  const items = []
  let cursor = startOfFortnight()
  for (let i = 0; i < count; i += 1) {
    items.push({
      start: new Date(cursor),
      end: addDays(cursor, 13),
      value: isoDate(cursor),
      label: `${formatDay(cursor)} – ${formatDay(addDays(cursor, 13))}`,
    })
    cursor = addDays(cursor, -14)
  }
  return items
}

export function dateInRange(date, start, end) {
  if (!date || !start || !end) return false
  const day = atMidnight(date)
  return day >= atMidnight(start) && day <= atMidnight(end)
}

export function upcomingWorkWeeks(count = 8) {
  let tuesday = startOfWorkWeek()
  const weeks = []

  for (let i = 0; i < count; i += 1) {
    const sunday = addDays(tuesday, 5)
    weeks.push({
      value: isoDate(tuesday),
      label: `${formatDay(tuesday)} – ${formatDay(sunday)}`,
    })
    tuesday = addDays(tuesday, 7)
  }

  return weeks
}
