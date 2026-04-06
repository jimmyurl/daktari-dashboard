import { useEffect, useState, useCallback } from 'react'
import { db } from '../lib/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AppointmentsPage() {
  const [appts,   setAppts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [statusF, setStatusF] = useState('all')
  const [payF,    setPayF]    = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db.from('appointments')
      .select('*,doctor:doctors(full_name,initials,color_hex),patient:patients(full_name,phone)')
      .order('appointment_date', { ascending: false })
    if (error) toast.error(error.message)
    else setAppts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    const { error } = await db.from('appointments').update({ status }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Marked as ${status}`)
    load()
  }

  const filtered = appts.filter(a => {
    const q = search.toLowerCase()
    const matchQ = !q || a.patient?.full_name?.toLowerCase().includes(q) ||
      a.doctor?.full_name?.toLowerCase().includes(q) || a.patient?.phone?.includes(q)
    return matchQ && (statusF==='all'||a.status===statusF) && (payF==='all'||a.payment_method===payF)
  })

  const sel = "px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-green-600"

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Appointments</h1>
        <p className="text-gray-400 text-sm">{appts.length} total</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
              outline-none focus:border-green-600" placeholder="Search patient, doctor..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className={sel} value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className={sel} value={payF} onChange={e => setPayF(e.target.value)}>
            <option value="all">All Payment</option>
            <option value="mpesa">M-Pesa</option>
            <option value="tigo_pesa">Tigo Pesa</option>
            <option value="airtel_money">Airtel Money</option>
            <option value="nhif">NHIF</option>
            <option value="sanlam">Sanlam</option>
            <option value="jubilee">Jubilee</option>
            <option value="strategis">Strategis</option>
            <option value="cash">Cash</option>
          </select>
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm
            text-gray-600" onClick={load}>🔄</button>
        </div>
        {loading
          ? <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>
              Loading...
            </div>
          : filtered.length === 0
          ? <div className="text-center py-14 text-gray-300">
              <div className="text-4xl mb-2">📅</div>No appointments found
            </div>
          : <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Patient','Doctor','Date & Time','Status','Payment','Amount','Actions'].map(h =>
                    <th key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider
                      px-4 py-3 text-left bg-gray-50">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="font-semibold text-sm">{a.patient?.full_name||'—'}</div>
                        <div className="text-xs text-gray-400">{a.patient?.phone||''}</div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center
                            text-white text-xs font-bold flex-shrink-0"
                            style={{ background:a.doctor?.color_hex||'#0D5C4A' }}>
                            {a.doctor?.initials||'?'}
                          </div>
                          <span className="text-xs">{a.doctor?.full_name||'—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="text-sm font-medium">
                          {a.appointment_date ? format(new Date(a.appointment_date),'MMM d, yyyy') : '—'}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {a.start_time?.substring(0,5)} – {a.end_time?.substring(0,5)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                          ${a.status==='confirmed'||a.status==='completed' ? 'bg-green-100 text-green-700'
                          : a.status==='pending' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-600'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                          ${a.payment_status==='paid' ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'}`}>
                          {a.payment_status}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 capitalize">
                          {a.payment_method?.replace(/_/g,' ')||'—'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 font-semibold text-sm"
                        style={{ color:'#0D5C4A' }}>
                        {a.amount_tsh ? `TSh ${Number(a.amount_tsh).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        {a.status==='pending' && (
                          <div className="flex gap-1.5">
                            <button className="text-xs py-1 px-2 bg-green-50 text-green-600
                              border border-green-200 rounded-lg"
                              onClick={() => updateStatus(a.id,'confirmed')}>✓ Confirm</button>
                            <button className="text-xs py-1 px-2 bg-red-50 text-red-500
                              border border-red-200 rounded-lg"
                              onClick={() => updateStatus(a.id,'cancelled')}>✕ Cancel</button>
                          </div>
                        )}
                        {a.status==='confirmed' && (
                          <button className="text-xs py-1 px-2 bg-blue-50 text-blue-600
                            border border-blue-200 rounded-lg"
                            onClick={() => updateStatus(a.id,'completed')}>Mark Done</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </div>
  )
}
