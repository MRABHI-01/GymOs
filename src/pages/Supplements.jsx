import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProgressBar from '../components/ProgressBar'
import DateSwitcher from '../components/DateSwitcher'
import { startOfDay, toDateKey } from '../lib/dates'

const TIMES = ['morning', 'afternoon', 'evening', 'night']
const TIME_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌇', night: '🌙' }
const emptyForm = { name: '', dose: '', time_of_day: 'morning' }

function Supplements() {
  const [supplements, setSupplements] = useState([])
  const [taken, setTaken] = useState(new Set()) // ids taken on the selected day
  const [date, setDate] = useState(startOfDay(new Date()))
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dateKey = toDateKey(date)

  // 1. Load the supplement list once
  useEffect(() => {
    async function loadSupplements() {
      const { data, error } = await supabase.from('supplements').select('*').order('created_at')
      if (error) setError(error.message)
      else setSupplements(data)
      setLoading(false)
    }
    loadSupplements()
  }, [])

  // 2. Load which ones were taken, every time the day changes
  useEffect(() => {
    async function loadLogs() {
      const { data, error } = await supabase
        .from('supplement_logs')
        .select('supplement_id')
        .eq('taken_on', dateKey)

      if (error) setError(error.message)
      else setTaken(new Set(data.map((log) => log.supplement_id)))
    }
    loadLogs()
  }, [dateKey])

  async function toggleTaken(id) {
    const wasTaken = taken.has(id)

    // Optimistic update: change the screen first so it feels instant
    const next = new Set(taken)
    if (wasTaken) next.delete(id)
    else next.add(id)
    setTaken(next)

    const { error } = wasTaken
      ? await supabase.from('supplement_logs').delete().eq('supplement_id', id).eq('taken_on', dateKey)
      : await supabase.from('supplement_logs').insert({ supplement_id: id, taken_on: dateKey })

    if (error) {
      setError(error.message)
      setTaken(taken) // undo if the server said no
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')

    const { data, error } = await supabase
      .from('supplements')
      .insert({ name: form.name.trim(), dose: form.dose.trim() || null, time_of_day: form.time_of_day })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return
    }
    setSupplements([...supplements, data])
    setForm({ ...emptyForm, time_of_day: form.time_of_day })
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove ${name}? Its history will be deleted too.`)) return
    const { error } = await supabase.from('supplements').delete().eq('id', id)
    if (error) setError(error.message)
    else setSupplements(supplements.filter((s) => s.id !== id))
  }

  const takenCount = supplements.filter((s) => taken.has(s.id)).length

  const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Supplements</h2>
        <DateSwitcher date={date} onChange={setDate} />
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : supplements.length === 0 ? (
        <p className="text-gray-500 text-center mb-8">No supplements yet. Add your first one below 💊</p>
      ) : (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
            <ProgressBar label="Taken" value={takenCount} target={supplements.length} unit="" />
          </div>

          <div className="space-y-6 mb-10">
            {TIMES.map((time) => {
              const items = supplements.filter((s) => s.time_of_day === time)
              if (items.length === 0) return null

              return (
                <div key={time}>
                  <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                    {TIME_ICONS[time]} {time}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((s) => {
                      const isTaken = taken.has(s.id)
                      return (
                        <li key={s.id} className="flex items-center gap-2">
                          <button
                            onClick={() => toggleTaken(s.id)}
                            className={`flex-1 flex items-center gap-3 p-4 rounded-xl text-left border ${
                              isTaken ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-gray-900 border-gray-900 hover:border-gray-700'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center text-sm ${
                                isTaken ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-gray-600'
                              }`}
                            >
                              {isTaken && '✓'}
                            </span>
                            <span>
                              <span className={`block font-medium ${isTaken ? 'line-through text-gray-400' : ''}`}>{s.name}</span>
                              {s.dose && <span className="block text-sm text-gray-500">{s.dose}</span>}
                            </span>
                          </button>
                          <button onClick={() => handleRemove(s.id, s.name)} className="px-2 text-gray-600 hover:text-red-400">
                            ✕
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Add a supplement */}
      <h3 className="text-lg font-semibold mb-3">Add supplement</h3>
      <form onSubmit={handleAdd} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input name="name" placeholder="Name (e.g. Creatine)" value={form.name} onChange={handleChange} className={inputClass} required />
          <input name="dose" placeholder="Dose (e.g. 5g)" value={form.dose} onChange={handleChange} className={inputClass} />
        </div>
        <select name="time_of_day" value={form.time_of_day} onChange={handleChange} className={`${inputClass} capitalize`}>
          {TIMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg py-2">
          + Add Supplement
        </button>
      </form>
    </div>
  )
}

export default Supplements