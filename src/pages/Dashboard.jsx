import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// A reusable card. We pass different data in through "props".
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

const comingSoon = [
  { to: '/nutrition', label: 'Nutrition', icon: '🍗' },
  { to: '/supplements', label: 'Supplements', icon: '💊' },
  { to: '/expenses', label: 'Expenses', icon: '💰' },
  { to: '/daily', label: 'Daily', icon: '📅' },
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const [name, setName] = useState('')
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      // Who is logged in?
      const { data: { user } } = await supabase.auth.getUser()
      setName(user?.email?.split('@')[0] ?? '')

      // Workouts from the last 7 days (including today)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 6)
      weekStart.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .gte('created_at', weekStart.toISOString())
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setWorkouts(data)
      setLoading(false)
    }
    load()
  }, [])

  // Calculations (derived from the data, no extra state needed)
  const today = new Date().toDateString()
  const todays = workouts.filter((w) => new Date(w.created_at).toDateString() === today)
  const volume = (list) => list.reduce((sum, w) => sum + w.sets * w.reps * w.weight, 0)
  const activeDays = new Set(workouts.map((w) => new Date(w.created_at).toDateString())).size

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold">
        {greeting()}{name && `, ${name}`} 👋
      </h2>
      <p className="text-gray-400 mb-6">Here's your progress at a glance.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard label="Today's exercises" value={todays.length} />
            <StatCard label="Today's volume" value={`${volume(todays).toLocaleString()} kg`} />
            <StatCard label="Active days" value={`${activeDays} / 7`} sub="This week" />
            <StatCard label="Week volume" value={`${volume(workouts).toLocaleString()} kg`} sub="Last 7 days" />
          </div>

          {/* Recent workouts */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Recent workouts</h3>
            <Link to="/workout" className="text-sm text-emerald-400 hover:underline">
              + Log workout
            </Link>
          </div>

          {workouts.length === 0 ? (
            <p className="text-gray-500 bg-gray-900 rounded-xl p-4 mb-8">
              No workouts this week yet. Time to hit the gym! 💪
            </p>
          ) : (
            <ul className="space-y-2 mb-8">
              {workouts.slice(0, 5).map((w) => (
                <li key={w.id} className="flex justify-between bg-gray-900 rounded-xl p-4">
                  <span className="font-medium">{w.exercise}</span>
                  <span className="text-sm text-gray-400">
                    {w.sets} × {w.reps} @ {w.weight} kg
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Other modules */}
          <h3 className="text-lg font-semibold mb-3">Coming soon</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {comingSoon.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className="bg-gray-900/50 border border-dashed border-gray-800 rounded-xl p-4 text-gray-500 hover:border-emerald-500 hover:text-white"
              >
                <span className="text-2xl">{m.icon}</span>
                <p className="mt-2">{m.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard