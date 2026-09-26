export const WEEKLY_BOOKING_LIMIT = 30
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
