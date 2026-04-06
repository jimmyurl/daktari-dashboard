import { useEffect, useState, useCallback } from 'react'
import { db } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-lg
              flex items-center justify-center hover:bg-gray-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

const ROLE_BADGE = {
  super_admin: 'bg-blue-100 text-blue-700',
  admin:       'bg-green-100 text-green-700',
  viewer:      'bg-gray-100 text-gray-600',
}

export default function AdminsPage() {
  const [admins,  setAdmins]  = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [adding,  setAdding]  = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'admin'
  })
  const { admin: currentAdmin } = useAuth()

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db
      .from('admin_users')
      .select('id, full_name, email, role, is_active, last_login, created_at')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setAdmins(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setAdding(true)
    const { data, error } = await db.rpc('create_admin_user', {
      p_full_name: form.full_name,
      p_email:     form.email,
      p_password:  form.password,
      p_role:      form.role,
    })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Admin created — they can now sign in')
      setShowAdd(false)
      setForm({ full_name: '', email: '', password: '', role: 'admin' })
      load()
    }
    setAdding(false)
  }

  const toggleActive = async (id, current) => {
    const { error } = await db
      .from('admin_users')
      .update({ is_active: !current })
      .eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(current ? 'Admin deactivated' : 'Admin activated')
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold">Admin Users</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Independent admin accounts — not connected to app users
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold
            text-sm text-white transition-all"
          style={{ background: '#0D5C4A' }}
          onClick={() => setShowAdd(true)}>
          ＋ Add Admin
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3
        text-sm text-blue-700 flex gap-2">
        <span>ℹ️</span>
        <span>These are <strong>admin panel accounts only</strong>.
          They are completely separate from Daktari app patients/users.</span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700
              rounded-full animate-spin"/>
            Loading...
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-14 text-gray-300">
            <div className="text-4xl mb-2">🛡️</div>
            <div className="text-sm">No admins yet. Run admin_users.sql first.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Admin','Email','Role','Last Login','Status','Actions'].map(h => (
                    <th key={h} className="text-xs font-bold text-gray-400 uppercase
                      tracking-wider px-4 py-3 text-left bg-gray-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center
                          text-white font-bold text-sm"
                          style={{ background: '#0D5C4A' }}>
                          {a.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 flex items-center gap-2">
                            {a.full_name}
                            {a.id === currentAdmin?.id && (
                              <span className="text-xs bg-green-100 text-green-700
                                px-1.5 py-0.5 rounded-full font-bold">YOU</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-50 text-sm text-gray-600">
                      {a.email}
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-50">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                        text-xs font-bold ${ROLE_BADGE[a.role] || 'bg-gray-100 text-gray-600'}`}>
                        {a.role === 'super_admin' ? '⚡ Super Admin'
                          : a.role === 'admin' ? '🛡 Admin' : '👁 Viewer'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-50 text-xs text-gray-400">
                      {a.last_login
                        ? format(new Date(a.last_login), 'MMM d, HH:mm')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-50">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                        text-xs font-bold ${a.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'}`}>
                        {a.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-50">
                      {a.id !== currentAdmin?.id && (
                        <button
                          onClick={() => toggleActive(a.id, a.is_active)}
                          className={`text-xs py-1 px-3 rounded-lg border font-semibold
                            transition-colors ${a.is_active
                              ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                          {a.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAdd && (
        <Modal title="Add New Admin" onClose={() => setShowAdd(false)}>
          <p className="text-sm text-gray-500 mb-4">
            Creates an independent admin panel account.
            This does <strong>not</strong> create a Supabase auth user.
          </p>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase
                tracking-wide mb-1.5">Full Name *</label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                text-sm outline-none focus:border-green-600"
                required placeholder="Admin Name"
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase
                tracking-wide mb-1.5">Email *</label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                text-sm outline-none focus:border-green-600"
                type="email" required placeholder="admin@daktari.co.tz"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase
                tracking-wide mb-1.5">Password *</label>
              <input className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                text-sm outline-none focus:border-green-600"
                type="password" required minLength={6} placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase
                tracking-wide mb-1.5">Role</label>
              <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl
                text-sm outline-none focus:border-green-600 bg-white"
                value={form.role}
                onChange={e => setForm({...form, role: e.target.value})}>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="viewer">Viewer (read only)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button"
                className="flex-1 py-2.5 rounded-xl border border-gray-200
                  text-gray-600 text-sm font-semibold hover:border-gray-400"
                onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button type="submit" disabled={adding}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: adding ? '#9CA3AF' : '#0D5C4A' }}>
                {adding ? 'Creating...' : 'Create Admin'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
