export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Local date as "YYYY-MM-DD" (for date columns in the database)
export function toDateKey(date) {
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b)
}

export function formatDayLabel(date) {
  if (isSameDay(date, new Date())) return 'Today'
  if (isSameDay(date, addDays(new Date(), -1))) return 'Yesterday'
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}