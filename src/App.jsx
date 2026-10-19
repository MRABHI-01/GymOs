import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Supplements from './pages/Supplements'
import Expenses from './pages/Expenses'
import Daily from './pages/Daily'

function App() {
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