import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'
import { startOfMonth, addMonths, formatMonthLabel, toDateKey, formatDayLabel } from '../lib/dates'

const MONTHLY_BUDGET = 10000 // later: user setting

const CATEGORIES = {
  gym: { label: 'Gym', icon: '🏋️' },
  food: { label: 'Food', icon: '🍗' },
  supplements: { label: 'Supplements', icon: '💊' },
  equipment: { label: 'Equipment', icon: '🎽' },
  health: { label: 'Health', icon: '🩺' },
  other: { label: 'Other', icon: '📦' },
}

// Formats numbers as Indian rupees: 12500 → ₹12,500
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

// A function, so the date is always "today" when the form resets
const emptyForm = () => ({ title: '', amount: '', category: 'gym', spent_on: toDateKey(new Date()) })

function Expenses() {
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const monthKey = toDateKey(month) // e.g. "2026-10-01"
  const isCurrentMonth = monthKey === toDateKey(startOfMonth(new Date()))

  // Load all expenses in the selected month
  useEffect(() => {
    async function loadExpenses() {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('spent_on', toDateKey(month))
        .lt('spent_on', toDateKey(addMonths(month, 1)))
        .order('spent_on', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setExpenses(data)
      setLoading(false)
    }
    loadExpenses()
  }, [month])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || Number(form.amount) <= 0) return
    setSaving(true)
    setError('')

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        spent_on: form.spent_on,
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }

    // Only show it if it belongs to the month on screen
    if (data.spent_on.slice(0, 7) === monthKey.slice(0, 7)) {
      setExpenses([data, ...expenses].sort((a, b) => b.spent_on.localeCompare(a.spent_on)))
    }
    setForm({ ...emptyForm(), category: form.category })
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) setError(error.message)
    else setExpenses(expenses.filter((x) => x.id !== id))
  }

  // ---- Calculations ----
  const total = expenses.reduce((sum, x) => sum + Number(x.amount), 0)

  // { gym: 2000, food: 3500, ... }
  const byCategory = expenses.reduce((acc, x) => {
    acc[x.category] = (acc[x.category] || 0) + Number(x.amount)
    return acc
  }, {})

  // [['food', 3500], ['gym', 2000], ...] biggest first
  const breakdown = Object.entries(byCategory).sort((a, b) => b[1] - a[1])

  const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'
  const navBtn = 'px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-30'

  return (
    <div className="max-w-2xl">
      {/* Header with month switcher */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth(addMonths(month, -1))} className={navBtn}>‹</button>
          <span className="w-32 text-center text-sm">{formatMonthLabel(month)}</span>
          <button onClick={() => setMonth(addMonths(month, 1))} disabled={isCurrentMonth} className={navBtn}>›</button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-400">Spent this month</p>
        <p className="text-3xl font-bold mb-4">{inr.format(total)}</p>
        <ProgressBar label="Budget" value={total} target={MONTHLY_BUDGET} unit="₹" />
      </div>

      {/* Category breakdown */}
      {breakdown.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-3">
          <h3 className="text-sm uppercase tracking-wide text-gray-400">By category</h3>
          {breakdown.map(([cat, amount]) => (
            <div key={cat}>
              <div className="flex justify-between text-sm mb-1">
                <span>{CATEGORIES[cat].icon} {CATEGORIES[cat].label}</span>
                <span className="text-gray-400">
                  {inr.format(amount)} · {Math.round((amount / total) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(amount / total) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add expense form */}
      <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-8 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input name="title" placeholder="What? (e.g. Gym fee)" value={form.title} onChange={handleChange} className={`${inputClass} col-span-2`} required />
          <input name="amount" type="number" min="1" step="0.01" placeholder="₹ Amount" value={form.amount} onChange={handleChange} className={inputClass} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <option key={key} value={key}>{c.icon} {c.label}</option>
            ))}
          </select>
          <input name="spent_on" type="date" max={toDateKey(new Date())} value={form.spent_on} onChange={handleChange} className={`${inputClass} [color-scheme:dark]`} required />
        </div>
        <button disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2">
          {saving ? 'Saving...' : '+ Add Expense'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* List */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading expenses...</p>
      ) : expenses.length === 0 ? (
        <p className="text-gray-500 text-center">No expenses in {formatMonthLabel(month)}. 💰</p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((x) => (
            <li key={x.id} className="flex items-center gap-3 bg-gray-900 rounded-xl p-4">
              <span className="text-2xl">{CATEGORIES[x.category].icon}</span>
              <div className="flex-1">
                <p className="font-semibold">{x.title}</p>
                <p className="text-sm text-gray-400">
                  {CATEGORIES[x.category].label} · {formatDayLabel(new Date(`${x.spent_on}T00:00`))}
                </p>
              </div>
              <span className="font-semibold">{inr.format(x.amount)}</span>
              <button onClick={() => handleDelete(x.id)} className="text-gray-500 hover:text-red-400 text-lg">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Expenses