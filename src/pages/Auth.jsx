import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Auth() {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (error) setError(error.message)
    else if (mode === 'signup') setMessage('Account created! If you are not logged in automatically, check your email.')
  }

  const inputClass =
    'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">GymOS 💪</h1>
        <p className="text-gray-400 text-center mb-8">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
          <input type="password" placeholder="Password (min 6 characters)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {message && <p className="text-emerald-400 text-sm">{message}</p>}

          <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg py-2">
            {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-emerald-400 hover:underline">
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth