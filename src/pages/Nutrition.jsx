   import DateSwitcher from '../components/DateSwitcher'
   import { startOfDay, addDays, formatDayLabel } from '../lib/dates'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'

// Daily goals (later we'll let users set their own in a Settings page)
const TARGETS = { calories: 2500, protein: 150, carbs: 300, fat: 70 }
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const emptyForm = { name: '', meal_type: 'breakfast', calories: '', protein: '', carbs: '', fat: '' }


function Nutrition() {
  const [date, setDate] = useState(startOfDay(new Date()))
  const [meals, setMeals] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isToday = date.getTime() === startOfDay(new Date()).getTime()

  // Load meals for the selected day. Runs again whenever "date" changes.
  useEffect(() => {
    async function loadMeals() {
      setLoading(true)
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .gte('eaten_at', date.toISOString())
        .lt('eaten_at', addDays(date, 1).toISOString())
        .order('eaten_at')

      if (error) setError(error.message)
      else setMeals(data)
      setLoading(false)
    }
    loadMeals()
  }, [date])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')

    // Today → now. Past day → noon of that day.
    const eatenAt = isToday ? new Date() : new Date(date.getTime() + 12 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('meals')
      .insert({
        name: form.name.trim(),
        meal_type: form.meal_type,
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        eaten_at: eatenAt.toISOString(),
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setMeals([...meals, data])
    setForm({ ...emptyForm, meal_type: form.meal_type }) // keep the same meal type selected
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('meals').delete().eq('id', id)
    if (error) setError(error.message)
    else setMeals(meals.filter((m) => m.id !== id))
  }

  // Totals for the day
  const total = (key) => meals.reduce((sum, m) => sum + Number(m[key]), 0)

     const dateLabel = formatDayLabel(date)

  const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'

  return (
    <div className="max-w-2xl">
      {/* Header with date switcher */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Nutrition</h2>
           <DateSwitcher date={date} onChange={setDate} />
      </div>

      {/* Daily progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-3">
        <ProgressBar label="Calories" value={total('calories')} target={TARGETS.calories} unit="kcal" />
        <ProgressBar label="Protein" value={total('protein')} target={TARGETS.protein} unit="g" />
        <ProgressBar label="Carbs" value={total('carbs')} target={TARGETS.carbs} unit="g" />
        <ProgressBar label="Fat" value={total('fat')} target={TARGETS.fat} unit="g" />
      </div>

      {/* Add meal form */}
      <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-8 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input name="name" placeholder="Food (e.g. Paneer + rice)" value={form.name} onChange={handleChange} className={`${inputClass} col-span-2`} required />
          <select name="meal_type" value={form.meal_type} onChange={handleChange} className={`${inputClass} capitalize`}>
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <input name="calories" type="number" min="0" placeholder="kcal" value={form.calories} onChange={handleChange} className={inputClass} required />
          <input name="protein" type="number" min="0" step="0.1" placeholder="Protein" value={form.protein} onChange={handleChange} className={inputClass} />
          <input name="carbs" type="number" min="0" step="0.1" placeholder="Carbs" value={form.carbs} onChange={handleChange} className={inputClass} />
          <input name="fat" type="number" min="0" step="0.1" placeholder="Fat" value={form.fat} onChange={handleChange} className={inputClass} />
        </div>
        <button disabled={saving} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2">
          {saving ? 'Saving...' : `+ Add to ${dateLabel}`}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Meals grouped by type */}
      {loading ? (
        <p className="text-gray-500 text-center">Loading meals...</p>
      ) : meals.length === 0 ? (
        <p className="text-gray-500 text-center">No meals logged for {dateLabel.toLowerCase()}. 🍽️</p>
      ) : (
        <div className="space-y-6">
          {MEAL_TYPES.map((type) => {
            const items = meals.filter((m) => m.meal_type === type)
            if (items.length === 0) return null

            return (
              <div key={type}>
                <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                  {type} · {items.reduce((s, m) => s + m.calories, 0)} kcal
                </h3>
                <ul className="space-y-2">
                  {items.map((m) => (
                    <li key={m.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-4">
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        <p className="text-sm text-gray-400">
                          {m.calories} kcal · P {m.protein}g · C {m.carbs}g · F {m.fat}g
                        </p>
                      </div>
                      <button onClick={() => handleDelete(m.id)} className="text-gray-500 hover:text-red-400 text-lg">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Nutrition