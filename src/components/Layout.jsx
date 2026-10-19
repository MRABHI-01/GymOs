import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', short: 'Home', icon: '🏠' },
  { to: '/workout', label: 'Workout', short: 'Workout', icon: '🏋️' },
  { to: '/nutrition', label: 'Nutrition', short: 'Food', icon: '🍗' },
  { to: '/supplements', label: 'Supplements', short: 'Supps', icon: '💊' },
  { to: '/expenses', label: 'Expenses', short: 'Money', icon: '💰' },
  { to: '/daily', label: 'Daily', short: 'Daily', icon: '📅' },
]

function Layout() {
  return (
    <div className="min-h-screen bg-gray-950 text-white md:flex">
      {/* Sidebar: only on bigger screens */}
      <aside className="hidden md:flex md:flex-col w-60 border-r border-gray-800 p-4 gap-1">
        <h1 className="text-2xl font-bold mb-6 px-3">GymOS 💪</h1>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActive ? 'bg-emerald-500 text-black font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </aside>

      {/* Page content goes here */}
      <main className="flex-1 p-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Bottom bar: only on phones */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${isActive ? 'text-emerald-400' : 'text-gray-400'}`
            }
          >
            <span className="text-xl">{item.icon}</span>
            {item.short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Layout