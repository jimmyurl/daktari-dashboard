import { useEffect, useState, useCallback } from 'react'
import { db } from '../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db.from('patients')
      .select('*').order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    else setPatients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    const { error } = await db.from('patients').update({ status }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Patient ${status}`)
    load()
  }

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    const matchQ = !q || p.full_name?.toLowerCase().includes(q) ||
      p.phone?.includes(q) || p.email?.toLowerCase().includes(q)
    return matchQ && (filter==='all' || p.status===filter)
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold">Patients</h1>
          <p className="text-gray-400 text-sm">{patients.length} registered patients</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
              outline-none focus:border-green-600" placeholder="Search name, phone, email..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
            outline-none focus:border-green-600"
            value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm
            text-gray-600 hover:border-gray-400" onClick={load}>🔄 Refresh</button>
        </div>
        {loading
          ? <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>
              Loading...
            </div>
          : filtered.length === 0
          ? <div className="text-center py-14 text-gray-300">
              <div className="text-4xl mb-2">👥</div>No patients found
            </div>
          : <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Patient','Phone','Email','Gender','Status','Joined','Actions'].map(h =>
                    <th key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider
                      px-4 py-3 text-left bg-gray-50">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center
                            text-white font-bold text-sm" style={{ background:'#0D5C4A' }}>
                            {(p.full_name||'?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{p.full_name||'—'}</div>
                            <div className="text-xs text-gray-400 font-mono">{p.id.substring(0,8)}…</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 text-sm">{p.phone||'—'}</td>
                      <td className="px-4 py-3.5 border-b border-gray-50 text-sm">{p.email||'—'}</td>
                      <td className="px-4 py-3.5 border-b border-gray-50 text-sm">{p.gender||'—'}</td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                          ${p.status==='active'?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>
                          {p.status||'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 text-xs text-gray-400">
                        {p.created_at ? format(new Date(p.created_at),'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="flex gap-2">
                          <button className="text-xs py-1.5 px-3 border border-gray-200 rounded-lg
                            text-gray-600 hover:border-gray-400" onClick={() => setSelected(p)}>
                            👁 View
                          </button>
                          {p.status!=='suspended'
                            ? <button className="text-xs py-1.5 px-3 bg-red-50 text-red-500
                                border border-red-200 rounded-lg hover:bg-red-100"
                                onClick={() => updateStatus(p.id,'suspended')}>🚫 Suspend</button>
                            : <button className="text-xs py-1.5 px-3 bg-green-50 text-green-600
                                border border-green-200 rounded-lg hover:bg-green-100"
                                onClick={() => updateStatus(p.id,'active')}>✓ Activate</button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
      {selected && (
        <Modal title="Patient Details" onClose={() => setSelected(null)}>
          <div className="grid grid-cols-2 gap-4">
            {[['Full Name',selected.full_name],['Phone',selected.phone],
              ['Email',selected.email],['Gender',selected.gender],
              ['Blood Type',selected.blood_type],
              ['Date of Birth',selected.date_of_birth?format(new Date(selected.date_of_birth),'MMM d, yyyy'):'—'],
              ['Status',selected.status],
              ['Joined',selected.created_at?format(new Date(selected.created_at),'MMM d, yyyy'):'—'],
            ].map(([k,v]) => (
              <div key={k}>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">{k}</div>
                <div className="text-sm font-medium mt-0.5">{v||'—'}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t">
            <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm
              text-gray-600 hover:border-gray-400" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
