import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'
import DateSwitcher from '../components/DateSwitcher'
import { startOfDay, toDateKey } from '../lib/dates'

const GOALS = { water_ml: 3000, steps: 10000, sleep_hours: 8 }

const MOODS = [
  { value: 1, emoji: '😫', label: 'Awful' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
]

const emptyLog = { sleep_hours: '', water_ml: '', steps: '', weight_kg: '', mood: null, notes: '' }

// '' → null (empty field), '7.5' → 7.5
function toNumberOrNull(value) {
  return value === '' || value === null ? null : Number(value)
}

function Daily() {
  const [date, setDate] = useState(startOfDay(new Date()))
  const [form, setForm] = useState(emptyLog)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const dateKey = toDateKey(date)

  // Load the log for the selected day (if there is one)
  useEffect(() => {
    async function loadLog() {
      setLoading(true)
      setMessage('')
      setError('')

      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('day', dateKey)
        .maybeSingle() // 0 or 1 row, both are fine

      if (error) setError(error.message)
      else if (data) {
        setForm({
          sleep_hours: data.sleep_hours ?? '',
          water_ml: data.water_ml ?? '',
          steps: data.steps ?? '',
          weight_kg: data.weight_kg ?? '',
          mood: data.mood,
          notes: data.notes ?? '',
        })
      } else {
        setForm(emptyLog)
      }
      setLoading(false)
    }
    loadLog()
  }, [dateKey])

  function update(field, value) {
    setForm({ ...form, [field]: value })
    setMessage('') // changed → no longer "saved"
  }

  function addWater(ml) {
    update('water_ml', (Number(form.water_ml) || 0) + ml)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()

    // Insert if no row exists for this day, otherwise update it
    const { error } = await supabase.from('daily_logs').upsert(
      {
        user_id: session.user.id,
        day: dateKey,
        sleep_hours: toNumberOrNull(form.sleep_hours),
        water_ml: toNumberOrNull(form.water_ml),
        steps: toNumberOrNull(form.steps),
        weight_kg: toNumberOrNull(form.weight_kg),
        mood: form.mood,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,day' }
    )

    setSaving(false)
    if (error) setError(error.message)
    else setMessage('Saved ✓')
  }

  const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'
  const label = 'block text-sm text-gray-400 mb-1'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Daily</h2>
        <DateSwitcher date={date} onChange={setDate} />
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : (
        <>
          {/* Goals */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 space-y-3">
            <ProgressBar label="💧 Water" value={Number(form.water_ml) || 0} target={GOALS.water_ml} unit="ml" />
            <ProgressBar label="👟 Steps" value={Number(form.steps) || 0} target={GOALS.steps} unit="" />
            <ProgressBar label="😴 Sleep" value={Number(form.sleep_hours) || 0} target={GOALS.sleep_hours} unit="h" />
          </div>

          <form onSubmit={handleSave} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-5">
            {/* Water with quick-add buttons */}
            <div>
              <label className={label}>💧 Water (ml)</label>
              <div className="flex gap-2">
                <input type="number" min="0" value={form.water_ml} onChange={(e) => update('water_ml', e.target.value)} className={inputClass} placeholder="0" />
                <button type="button" onClick={() => addWater(250)} className="shrink-0 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">+250</button>
                <button type="button" onClick={() => addWater(500)} className="shrink-0 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">+500</button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label}>😴 Sleep (h)</label>
                <input type="number" min="0" max="24" step="0.5" value={form.sleep_hours} onChange={(e) => update('sleep_hours', e.target.value)} className={inputClass} placeholder="7.5" />
              </div>
              <div>
                <label className={label}>👟 Steps</label>
                <input type="number" min="0" value={form.steps} onChange={(e) => update('steps', e.target.value)} className={inputClass} placeholder="8000" />
              </div>
              <div>
                <label className={label}>⚖️ Weight (kg)</label>
                <input type="number" min="1" step="0.1" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} className={inputClass} placeholder="70" />
              </div>
            </div>

            {/* Mood picker */}
            <div>
              <label className={label}>Mood</label>
              <div className="flex gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => update('mood', form.mood === m.value ? null : m.value)}
                    className={`flex-1 flex flex-col items-center py-2 rounded-lg border ${
                      form.mood === m.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs text-gray-400">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={label}>📝 Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} className={inputClass} placeholder="How was your day? Any PRs?" />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex items-center gap-3">
              <button disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2">
                {saving ? 'Saving...' : 'Save day'}
              </button>
              {message && <span className="text-emerald-400 text-sm">{message}</span>}
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default Daily