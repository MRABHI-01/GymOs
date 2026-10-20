import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Supplements from './pages/Supplements'
import Expenses from './pages/Expenses'
import Daily from './pages/Daily'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if the user is already logged in
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Listen for login / logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe() // cleanup
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-gray-950 text-gray-400 flex items-center justify-center">Loading...</div>
  }

  if (!session) return <Auth />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/nutrition" element={<Nutrition />} />
          <Route path="/supplements" element={<Supplements />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/daily" element={<Daily />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App