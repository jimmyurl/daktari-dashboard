import { useEffect, useState, useCallback } from 'react'
import { db } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'

const PAYMENT_COLORS = {
  mpesa: '#4CAF50', tigo_pesa: '#2196F3', airtel_money: '#FF5722',
  nhif: '#9C27B0', sanlam: '#FF9800', jubilee: '#00BCD4',
  strategis: '#795548', cash: '#607D8B',
}

const fmtTsh  = n  => `TSh ${Number(n || 0).toLocaleString()}`
const fmtDate = d  => format(new Date(d), 'MMM d, yyyy')

function SummaryCard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      style={{ borderLeft: `5px solid ${color}` }}>
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-extrabold text-2xl leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-2">{label}</div>
    </div>
  )
}

export default function RevenuePage() {
  const [rows,       setRows]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [range,      setRange]      = useState('month') // today | week | month | all
  const [search,     setSearch]     = useState('')
  const [payFilter,  setPayFilter]  = useState('all')
  const [dailyChart, setDailyChart] = useState([])
  const [payPie,     setPayPie]     = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const today = new Date()
    let query = db.from('appointments')
      .select('id,appointment_date,amount_tsh,payment_method,payment_status,patient:patients(full_name,phone),doctor:doctors(full_name,initials,color_hex)')
      .not('amount_tsh', 'is', null)
      .order('appointment_date', { ascending: false })

    if (range === 'today') {
      const d = format(today, 'yyyy-MM-dd')
      query = query.eq('appointment_date', d)
    } else if (range === 'week') {
      query = query
        .gte('appointment_date', format(startOfWeek(today), 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfWeek(today),   'yyyy-MM-dd'))
    } else if (range === 'month') {
      query = query
        .gte('appointment_date', format(startOfMonth(today), 'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfMonth(today),   'yyyy-MM-dd'))
    }

    const { data } = await query
    const all = data || []
    setRows(all)

    // Daily chart (last 14 days within range)
    const dayCounts = {}
    all.forEach(r => {
      const d = format(new Date(r.appointment_date), 'MMM d')
      dayCounts[d] = (dayCounts[d] || 0) + Number(r.amount_tsh || 0)
    })
    setDailyChart(
      Object.entries(dayCounts).slice(0, 14).reverse()
        .map(([date, total]) => ({ date, total }))
    )

    // Payment method pie
    const pmCounts = {}
    all.forEach(r => {
      const pm = r.payment_method || 'unknown'
      pmCounts[pm] = (pmCounts[pm] || 0) + Number(r.amount_tsh || 0)
    })
    setPayPie(Object.entries(pmCounts).map(([name, value]) => ({ name, value })))

    setLoading(false)
  }, [range])

  useEffect(() => { load() }, [load])

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q
      || r.patient?.full_name?.toLowerCase().includes(q)
      || r.doctor?.full_name?.toLowerCase().includes(q)
      || r.patient?.phone?.includes(q)
    return matchQ && (payFilter === 'all' || r.payment_method === payFilter)
  })

  const totalRevenue   = filtered.reduce((s, r) => s + Number(r.amount_tsh || 0), 0)
  const paidRevenue    = filtered.filter(r => r.payment_status === 'paid')
                                 .reduce((s, r) => s + Number(r.amount_tsh || 0), 0)
  const pendingRevenue = totalRevenue - paidRevenue

  const rangeBtnCls = active =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
      active ? 'bg-green-700 text-white border-green-700'
             : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'}`

  const sel = "px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-green-600"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Revenue</h1>
          <p className="text-gray-400 text-sm mt-0.5">Financial overview · Daktari Tanzania</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['today','Today'],['week','This Week'],['month','This Month'],['all','All Time']].map(([v,l]) => (
            <button key={v} className={rangeBtnCls(range===v)} onClick={() => setRange(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon="💰" label="Total Revenue"   value={fmtTsh(totalRevenue)}   color="#0D5C4A"/>
        <SummaryCard icon="✅" label="Collected"       value={fmtTsh(paidRevenue)}    color="#2D4A8A"
          sub={`${filtered.filter(r=>r.payment_status==='paid').length} transactions`}/>
        <SummaryCard icon="⏳" label="Outstanding"     value={fmtTsh(pendingRevenue)} color="#E84545"
          sub={`${filtered.filter(r=>r.payment_status!=='paid').length} unpaid`}/>
        <SummaryCard icon="🧾" label="Transactions"    value={filtered.length}        color="#7B3FA0"/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4">Revenue Over Time</h3>
          {dailyChart.length === 0
            ? <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="date" tick={{ fontSize:11, fill:'#9CA3AF' }}/>
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`}
                    tick={{ fontSize:11, fill:'#9CA3AF' }}/>
                  <Tooltip formatter={v => fmtTsh(v)}
                    contentStyle={{ borderRadius:12, fontSize:13 }}/>
                  <Bar dataKey="total" fill="#0D5C4A" radius={[6,6,0,0]} name="Revenue"/>
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">By Payment Method</h3>
          {payPie.length === 0
            ? <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={payPie} cx="50%" cy="45%" innerRadius={45} outerRadius={75}
                    dataKey="value" nameKey="name" paddingAngle={3}>
                    {payPie.map((e,i) => (
                      <Cell key={i} fill={PAYMENT_COLORS[e.name] || '#9CA3AF'}/>
                    ))}
                  </Pie>
                  <Legend formatter={v => <span style={{fontSize:11,textTransform:'capitalize'}}>{v.replace(/_/g,' ')}</span>}/>
                  <Tooltip formatter={v => fmtTsh(v)} contentStyle={{ borderRadius:12, fontSize:13 }}/>
                </PieChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex gap-3 mb-5 flex-wrap items-center justify-between">
          <h3 className="font-bold text-gray-800">Transactions</h3>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                outline-none focus:border-green-600 w-52" placeholder="Search patient, doctor..."
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <select className={sel} value={payFilter} onChange={e => setPayFilter(e.target.value)}>
              <option value="all">All Methods</option>
              <option value="mpesa">M-Pesa</option>
              <option value="tigo_pesa">Tigo Pesa</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="nhif">NHIF</option>
              <option value="sanlam">Sanlam</option>
              <option value="jubilee">Jubilee</option>
              <option value="strategis">Strategis</option>
              <option value="cash">Cash</option>
            </select>
            <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              onClick={load}>🔄</button>
          </div>
        </div>

        {loading
          ? <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>
              Loading...
            </div>
          : filtered.length === 0
          ? <div className="text-center py-14 text-gray-300">
              <div className="text-4xl mb-2">💰</div>No transactions found
            </div>
          : <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Patient','Doctor','Date','Amount','Method','Status'].map(h =>
                    <th key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider
                      px-4 py-3 text-left bg-gray-50">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="font-semibold text-sm">{r.patient?.full_name||'—'}</div>
                        <div className="text-xs text-gray-400">{r.patient?.phone||''}</div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center
                            text-white text-xs font-bold flex-shrink-0"
                            style={{ background: r.doctor?.color_hex||'#0D5C4A' }}>
                            {r.doctor?.initials||'?'}
                          </div>
                          <span className="text-xs">{r.doctor?.full_name||'—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 text-sm">
                        {r.appointment_date ? fmtDate(r.appointment_date) : '—'}
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 font-bold text-sm"
                        style={{ color:'#0D5C4A' }}>
                        {fmtTsh(r.amount_tsh)}
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                          text-xs font-bold bg-gray-100 text-gray-600 capitalize">
                          {r.payment_method?.replace(/_/g,' ')||'—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                          text-xs font-bold ${
                            r.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'}`}>
                          {r.payment_status || 'unpaid'}
                        </span>
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