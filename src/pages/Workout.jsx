import { useState, useEffect } from 'react'

const emptyForm = { exercise: '', sets: '', reps: '', weight: '' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function Workout() {
  // 1. All logged workouts (loaded from the browser on first render)
  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem('gymos-workouts')
    return saved ? JSON.parse(saved) : []
  })

  // 2. What the user is typing in the form right now
  const [form, setForm] = useState(emptyForm)

  // 3. Every time workouts change, save them to the browser
  useEffect(() => {
    localStorage.setItem('gymos-workouts', JSON.stringify(workouts))
  }, [workouts])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault() // stop the page from reloading
    if (!form.exercise.trim()) return

    const newWorkout = {
      id: Date.now().toString(),
      exercise: form.exercise.trim(),
      sets: Number(form.sets),
      reps: Number(form.reps),
      weight: Number(form.weight),
      date: new Date().toISOString(),
    }

    setWorkouts([newWorkout, ...workouts]) // newest on top
    setForm(emptyForm) // clear the form
  }

  function handleDelete(id) {
    setWorkouts(workouts.filter((w) => w.id !== id))
  }

  // Today's stats
  const today = new Date().toDateString()
  const todays = workouts.filter((w) => new Date(w.date).toDateString() === today)
  const todayVolume = todays.reduce((sum, w) => sum + w.sets * w.reps * w.weight, 0)

  const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-1">Workout</h2>
      <p className="text-gray-400 mb-6">
        Today: {todays.length} exercises · {todayVolume.toLocaleString()} kg volume
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-8 space-y-3">
        <input
          name="exercise"
          placeholder="Exercise (e.g. Bench Press)"
          value={form.exercise}
          onChange={handleChange}
          className={inputClass}
          required
        />
        <div className="grid grid-cols-3 gap-3">
          <input name="sets" type="number" min="1" placeholder="Sets" value={form.sets} onChange={handleChange} className={inputClass} required />
          <input name="reps" type="number" min="1" placeholder="Reps" value={form.reps} onChange={handleChange} className={inputClass} required />
          <input name="weight" type="number" min="0" step="0.5" placeholder="Kg" value={form.weight} onChange={handleChange} className={inputClass} required />
        </div>
        <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg py-2">
          + Add Exercise
        </button>
      </form>

      {/* List */}
      {workouts.length === 0 ? (
        <p className="text-gray-500 text-center">No workouts yet. Log your first one above 💪</p>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w) => (
            <li key={w.id} className="flex items-center justify-between bg-gray-900 rounded-xl p-4">
              <div>
                <p className="font-semibold">{w.exercise}</p>
                <p className="text-sm text-gray-400">
                  {w.sets} × {w.reps} @ {w.weight} kg · {formatDate(w.date)}
                </p>
              </div>
              <button onClick={() => handleDelete(w.id)} className="text-gray-500 hover:text-red-400 text-lg">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Workout