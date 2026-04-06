import { useEffect, useState } from 'react'
import { db, supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = { confirmed:'#0D5C4A', pending:'#F4B942',
  completed:'#2D4A8A', cancelled:'#E84545', no_show:'#9CA3AF' }

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-extrabold" style={{ color }}>{value ?? '—'}</div>
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-1">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats,  setStats]  = useState(null)
  const [recent, setRecent] = useState([])
  const [trend,  setTrend]  = useState([])
  const [pie,    setPie]    = useState([])

  useEffect(() => {
    // Stats
    supabase.rpc('daktari.get_dashboard_stats').then(({ data }) => {
      if (data) setStats(data)
    })
    // Recent appointments
    db.from('appointments')
      .select('*,doctor:doctors(full_name,initials,color_hex),patient:patients(full_name,phone)')
      .order('created_at', { ascending: false }).limit(8)
      .then(({ data }) => { if (data) setRecent(data) })
    // Trend
    db.from('appointments').select('appointment_date')
      .order('appointment_date', { ascending: false }).limit(60)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        data.forEach(a => {
          const d = format(new Date(a.appointment_date), 'MMM d')
          counts[d] = (counts[d] || 0) + 1
        })
        setTrend(Object.entries(counts).slice(0,7).reverse()
          .map(([date, count]) => ({ date, count })))
      })
    // Pie
    db.from('appointments').select('status').then(({ data }) => {
      if (!data) return
      const counts = {}
      data.forEach(a => { counts[a.status] = (counts[a.status]||0)+1 })
      setPie(Object.entries(counts).map(([name, value]) => ({ name, value })))
    })
  }, [])

  const fmtTsh = n => n ? `TSh ${Number(n).toLocaleString()}` : 'TSh 0'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Live overview · Daktari Tanzania</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon="👥" label="Patients"     value={stats?.total_patients}       color="#0D5C4A"/>
        <StatCard icon="🩺" label="Doctors"      value={stats?.total_doctors}        color="#2D4A8A"/>
        <StatCard icon="📅" label="Appointments" value={stats?.total_appointments}   color="#7B3FA0"/>
        <StatCard icon="⏳" label="Today"        value={stats?.today_appointments}   color="#C45C1A"/>
        <StatCard icon="🔔" label="Pending"      value={stats?.pending_appointments} color="#E84545"/>
        <StatCard icon="💰" label="Revenue"      value={fmtTsh(stats?.total_revenue)} color="#0D5C4A"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4">Appointment Trend</h3>
          {trend.length === 0
            ? <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="date" tick={{ fontSize:11, fill:'#9CA3AF' }}/>
                  <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }}/>
                  <Tooltip contentStyle={{ borderRadius:12, fontSize:13 }}/>
                  <Bar dataKey="count" fill="#0D5C4A" radius={[6,6,0,0]} name="Appointments"/>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Status Distribution</h3>
          {pie.length === 0
            ? <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data yet</div>
            : <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {pie.map((e,i) => <Cell key={i} fill={COLORS[e.name]||'#9CA3AF'}/>)}
                  </Pie>
                  <Legend formatter={v => <span style={{fontSize:11}}>{v}</span>}/>
                  <Tooltip contentStyle={{ borderRadius:12, fontSize:13 }}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Recent Appointments</h3>
        {recent.length === 0
          ? <div className="text-center py-10 text-gray-300">
              <div className="text-4xl mb-2">📅</div>No appointments yet
            </div>
          : <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Patient','Doctor','Date','Time','Status','Payment'].map(h =>
                    <th key={h} className="text-xs font-bold text-gray-400 uppercase
                      tracking-wider px-4 py-3 text-left bg-gray-50">{h}</th>)}
                </tr></thead>
                <tbody>
                  {recent.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 border-b border-gray-50">
                        <div className="font-semibold text-sm">{a.patient?.full_name||'—'}</div>
                        <div className="text-xs text-gray-400">{a.patient?.phone||''}</div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center
                            text-white text-xs font-bold"
                            style={{ background: a.doctor?.color_hex||'#0D5C4A' }}>
                            {a.doctor?.initials||'?'}
                          </div>
                          <span className="text-xs">{a.doctor?.full_name||'—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50 text-sm">
                        {a.appointment_date ? format(new Date(a.appointment_date),'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50 text-sm font-mono">
                        {a.start_time?.substring(0,5)||'—'}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                          text-xs font-bold ${
                            a.status==='confirmed'||a.status==='completed' ? 'bg-green-100 text-green-700'
                            : a.status==='pending' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b border-gray-50 text-xs text-gray-500 capitalize">
                        {a.payment_method?.replace('_',' ')||'—'}
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
