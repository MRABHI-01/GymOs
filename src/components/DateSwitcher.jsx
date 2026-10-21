import { addDays, formatDayLabel, isSameDay } from '../lib/dates'

function DateSwitcher({ date, onChange }) {
  const isToday = isSameDay(date, new Date())
  const btn = 'px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-30'

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(addDays(date, -1))} className={btn}>‹</button>
      <span className="w-28 text-center text-sm">{formatDayLabel(date)}</span>
      <button onClick={() => onChange(addDays(date, 1))} disabled={isToday} className={btn}>›</button>
    </div>
  )
}

export default DateSwitcher