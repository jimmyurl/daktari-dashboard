import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { to: '/',             icon: '🏠', label: 'Dashboard'    },
  { to: '/patients',     icon: '👥', label: 'Patients'     },
  { to: '/doctors',      icon: '🩺', label: 'Doctors'      },
  { to: '/appointments', icon: '📅', label: 'Appointments' },
  { to: '/admins',       icon: '🛡️', label: 'Admin Users'  },
  { to: '/setup',        icon: '⚙️', label: 'Setup Guide'  },
]

export default function Layout() {
  const { admin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    signOut()
    toast.success('Signed out')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col"
        style={{ background: 'linear-gradient(180deg,#0D5C4A 0%,#074033 100%)' }}>
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏥</div>
            <div>
              <div className="text-white font-bold text-base leading-none">Daktari</div>
              <div className="text-white/50 text-xs mt-0.5">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="text-white/30 text-xs font-bold uppercase tracking-widest px-3 mb-2">Menu</div>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all ${
                  isActive ? 'bg-white/20 text-white font-semibold'
                           : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <span className="text-base w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center
              text-white font-bold text-sm">
              {admin?.full_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{admin?.full_name}</div>
              <div className="text-white/40 text-xs truncate">{admin?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full text-xs text-white/50 hover:text-white py-1.5 px-3
              rounded-lg border border-white/10 hover:border-white/30 transition-all">
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center
          justify-between flex-shrink-0">
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-TZ',
              { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center
            text-white text-sm font-bold" style={{ background: '#0D5C4A' }}>
            {admin?.full_name?.charAt(0) || 'A'}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
