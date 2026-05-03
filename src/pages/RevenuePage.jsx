import { useEffect, useState, useCallback } from 'react'
import { db } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import toast from 'react-hot-toast'

// ── Constants ────────────────────────────────────────────────────────────────
const INSURERS = ['nhif','sanlam','jubilee','strategis']
const MOBILE   = ['mpesa','tigo_pesa','airtel_money']
const ALL_NON_CASH = [...INSURERS, ...MOBILE]

const INSURER_COLORS = {
  nhif:'#9C27B0', sanlam:'#FF9800', jubilee:'#00BCD4',
  strategis:'#795548', mpesa:'#4CAF50', tigo_pesa:'#2196F3',
  airtel_money:'#FF5722', cash:'#607D8B',
}
const STATUS_CFG = {
  submitted:      { label:'Submitted',      bg:'bg-blue-100',   text:'text-blue-700'   },
  partially_paid: { label:'Partial',        bg:'bg-yellow-100', text:'text-yellow-700' },
  paid:           { label:'Paid',           bg:'bg-green-100',  text:'text-green-700'  },
  rejected:       { label:'Rejected',       bg:'bg-red-100',    text:'text-red-600'    },
}

const fmtTsh  = n => `TSh ${Number(n || 0).toLocaleString()}`
const fmtDate = d => d ? format(parseISO(d), 'MMM d, yyyy') : '—'
const cap     = s => s ? s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : '—'

// ── Sub-components ───────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between"
      style={{ borderLeft:`5px solid ${color}`, minHeight:130 }}>
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="font-extrabold text-2xl leading-none" style={{ color }}>{value}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-2">{label}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.submitted
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

// ── New Claim Modal ──────────────────────────────────────────────────────────
function NewClaimModal({ onClose, onSaved }) {
  const [insurer,   setInsurer]   = useState('nhif')
  const [start,     setStart]     = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [end,       setEnd]       = useState(format(endOfMonth(new Date()),   'yyyy-MM-dd'))
  const [appts,     setAppts]     = useState([])
  const [selected,  setSelected]  = useState(new Set())
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  const search = useCallback(async () => {
    setLoading(true)
    // Find appointments with this payment method, not yet in a claim, in date range
    const { data: claimed } = await db
      .from('insurance_claim_appointments')
      .select('appointment_id')
    const claimedIds = (claimed || []).map(c => c.appointment_id)

    let q = db.from('appointments')
      .select('id,appointment_date,amount_tsh,patient:patients(full_name,phone),doctor:doctors(full_name,initials,color_hex)')
      .eq('payment_method', insurer)
      .gte('appointment_date', start)
      .lte('appointment_date', end)
      .order('appointment_date', { ascending: false })

    const { data } = await q
    // Filter out already-claimed appointments
    const unclaimed = (data || []).filter(a => !claimedIds.includes(a.id))
    setAppts(unclaimed)
    setSelected(new Set(unclaimed.map(a => a.id))) // select all by default
    setLoading(false)
  }, [insurer, start, end])

  useEffect(() => { search() }, [search])

  const toggle = id => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () =>
    setSelected(selected.size === appts.length ? new Set() : new Set(appts.map(a => a.id)))

  const totalClaimed = appts
    .filter(a => selected.has(a.id))
    .reduce((s, a) => s + Number(a.amount_tsh || 0), 0)

  const save = async () => {
    if (selected.size === 0) { toast.error('Select at least one appointment'); return }
    setSaving(true)
    // Insert claim
    const { data: claim, error } = await db.from('insurance_claims').insert({
      insurer, period_start: start, period_end: end,
      total_claimed: totalClaimed, status: 'submitted',
    }).select().single()

    if (error) { toast.error(error.message); setSaving(false); return }

    // Link appointments
    const links = [...selected].map(appointment_id => ({
      claim_id: claim.id, appointment_id,
      amount_claimed: appts.find(a=>a.id===appointment_id)?.amount_tsh || 0,
    }))
    const { error: linkErr } = await db.from('insurance_claim_appointments').insert(links)
    if (linkErr) { toast.error(linkErr.message); setSaving(false); return }

    toast.success('Claim batch submitted!')
    setSaving(false)
    onSaved()
  }

  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-600"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">New Insurance Claim Batch</h2>
            <p className="text-xs text-gray-400 mt-0.5">Select appointments to include in this claim</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-100 grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Insurer</label>
            <select className={inp} value={insurer} onChange={e => setInsurer(e.target.value)}>
              {ALL_NON_CASH.map(i => <option key={i} value={i}>{cap(i)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">From</label>
            <input type="date" className={inp} value={start} onChange={e => setStart(e.target.value)}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">To</label>
            <input type="date" className={inp} value={end} onChange={e => setEnd(e.target.value)}/>
          </div>
        </div>

        {/* Appointments list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading
            ? <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>
                Loading...
              </div>
            : appts.length === 0
            ? <div className="text-center py-10 text-gray-300">
                <div className="text-3xl mb-2">🔍</div>
                No unclaimed appointments for this insurer & period
              </div>
            : <>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input type="checkbox" checked={selected.size === appts.length}
                      onChange={toggleAll} className="rounded"/>
                    Select all ({appts.length})
                  </label>
                  <span className="text-xs text-gray-400">{selected.size} selected</span>
                </div>
                <div className="space-y-2">
                  {appts.map(a => (
                    <label key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100
                      hover:bg-gray-50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)} className="rounded flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{a.patient?.full_name||'—'}</div>
                        <div className="text-xs text-gray-400">{a.patient?.phone} · Dr. {a.doctor?.full_name}</div>
                      </div>
                      <div className="text-xs text-gray-400">{fmtDate(a.appointment_date)}</div>
                      <div className="font-bold text-sm" style={{ color:'#0D5C4A' }}>
                        {fmtTsh(a.amount_tsh)}
                      </div>
                    </label>
                  ))}
                </div>
              </>
          }
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">Total Claim Amount</div>
            <div className="font-extrabold text-xl" style={{ color:'#0D5C4A' }}>{fmtTsh(totalClaimed)}</div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
              Cancel
            </button>
            <button onClick={save} disabled={saving || selected.size === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background:'#0D5C4A' }}>
              {saving ? 'Submitting...' : `Submit Claim (${selected.size} appts)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Record Payment Modal ─────────────────────────────────────────────────────
function RecordPaymentModal({ claim, onClose, onSaved }) {
  const [amountPaid, setAmountPaid] = useState(claim.total_paid ?? claim.total_claimed)
  const [paidAt,     setPaidAt]     = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes,      setNotes]      = useState(claim.notes || '')
  const [saving,     setSaving]     = useState(false)

  const save = async () => {
    setSaving(true)
    const paid     = Number(amountPaid)
    const claimed  = Number(claim.total_claimed)
    const status   = paid <= 0 ? 'rejected'
                   : paid < claimed ? 'partially_paid'
                   : 'paid'

    const { error } = await db.from('insurance_claims').update({
      total_paid: paid, paid_at: paidAt, status, notes, updated_at: new Date().toISOString(),
    }).eq('id', claim.id)

    if (error) { toast.error(error.message); setSaving(false); return }

    // If fully/partially paid, mark linked appointments as paid
    if (paid > 0) {
      const { data: links } = await db
        .from('insurance_claim_appointments')
        .select('appointment_id')
        .eq('claim_id', claim.id)

      if (links?.length) {
        await db.from('appointments')
          .update({ payment_status: status === 'paid' ? 'paid' : 'partial' })
          .in('id', links.map(l => l.appointment_id))
      }
    }

    toast.success('Payment recorded!')
    setSaving(false)
    onSaved()
  }

  const inp = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-600"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">Record Payment</h2>
            <p className="text-xs text-gray-400 mt-0.5">{cap(claim.insurer)} · {fmtDate(claim.period_start)} – {fmtDate(claim.period_end)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 flex justify-between">
            <div>
              <div className="text-xs text-gray-400">Amount Claimed</div>
              <div className="font-bold text-base">{fmtTsh(claim.total_claimed)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Appointments</div>
              <div className="font-bold text-base">{claim.appointment_count || '—'}</div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount Paid by Insurer (TSh)</label>
            <input type="number" className={inp} value={amountPaid}
              onChange={e => setAmountPaid(e.target.value)}
              placeholder="Enter amount received"/>
            {Number(amountPaid) < Number(claim.total_claimed) && Number(amountPaid) > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠ Short payment: TSh {Number(Number(claim.total_claimed) - Number(amountPaid)).toLocaleString()} not covered
              </p>
            )}
            {Number(amountPaid) <= 0 && (
              <p className="text-xs text-red-500 mt-1">⚠ Amount of 0 will mark this claim as Rejected</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Date Payment Received</label>
            <input type="date" className={inp} value={paidAt} onChange={e => setPaidAt(e.target.value)}/>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes (optional)</label>
            <textarea className={inp} rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Reference number, partial payment reason..."/>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background:'#0D5C4A' }}>
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Claim Detail Modal ───────────────────────────────────────────────────────
function ClaimDetailModal({ claim, onClose }) {
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    db.from('insurance_claim_appointments')
      .select('amount_claimed,appointment:appointments(id,appointment_date,start_time,amount_tsh,payment_status,patient:patients(full_name,phone),doctor:doctors(full_name,initials,color_hex))')
      .eq('claim_id', claim.id)
      .then(({ data }) => { setAppts(data || []); setLoading(false) })
  }, [claim.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold">{cap(claim.insurer)} Claim</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {fmtDate(claim.period_start)} – {fmtDate(claim.period_end)} · <StatusBadge status={claim.status}/>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-4 border-b border-gray-100">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400">Claimed</div>
            <div className="font-bold text-base mt-1">{fmtTsh(claim.total_claimed)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400">Paid</div>
            <div className="font-bold text-base mt-1" style={{ color:'#0D5C4A' }}>
              {claim.total_paid ? fmtTsh(claim.total_paid) : '—'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400">Difference</div>
            <div className="font-bold text-base mt-1" style={{ color: claim.total_paid < claim.total_claimed ? '#E84545' : '#0D5C4A' }}>
              {claim.total_paid
                ? fmtTsh(Number(claim.total_claimed) - Number(claim.total_paid))
                : '—'}
            </div>
          </div>
        </div>

        {claim.notes && (
          <div className="px-6 pt-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
              📝 {claim.notes}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading
            ? <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>
              </div>
            : <div className="space-y-2">
                {appts.map((item, i) => {
                  const a = item.appointment
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: a?.doctor?.color_hex || '#0D5C4A' }}>
                        {a?.doctor?.initials || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{a?.patient?.full_name || '—'}</div>
                        <div className="text-xs text-gray-400">{a?.patient?.phone} · Dr. {a?.doctor?.full_name}</div>
                      </div>
                      <div className="text-xs text-gray-400">{fmtDate(a?.appointment_date)}</div>
                      <div className="font-bold text-sm" style={{ color:'#0D5C4A' }}>
                        {fmtTsh(item.amount_claimed)}
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        a?.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {a?.payment_status || 'unpaid'}
                      </span>
                    </div>
                  )
                })}
              </div>
          }
        </div>
      </div>
    </div>
  )
}

// ── Main Revenue Page ────────────────────────────────────────────────────────
export default function RevenuePage() {
  const [tab,        setTab]        = useState('overview')  // overview | claims
  const [rows,       setRows]       = useState([])
  const [claims,     setClaims]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [claimsLoad, setClaimsLoad] = useState(true)
  const [range,      setRange]      = useState('month')
  const [search,     setSearch]     = useState('')
  const [payFilter,  setPayFilter]  = useState('all')
  const [dailyChart, setDailyChart] = useState([])
  const [payPie,     setPayPie]     = useState([])
  const [showNew,    setShowNew]    = useState(false)
  const [payModal,   setPayModal]   = useState(null)
  const [detailModal,setDetailModal]= useState(null)
  const [claimFilter,setClaimFilter]= useState('all')

  // Load revenue rows
  const loadRevenue = useCallback(async () => {
    setLoading(true)
    const today = new Date()
    let query = db.from('appointments')
      .select('id,appointment_date,amount_tsh,payment_method,payment_status,patient:patients(full_name,phone),doctor:doctors(full_name,initials,color_hex)')
      .not('amount_tsh', 'is', null)
      .order('appointment_date', { ascending: false })

    if (range === 'today') {
      query = query.eq('appointment_date', format(today,'yyyy-MM-dd'))
    } else if (range === 'week') {
      query = query
        .gte('appointment_date', format(startOfWeek(today),'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfWeek(today),'yyyy-MM-dd'))
    } else if (range === 'month') {
      query = query
        .gte('appointment_date', format(startOfMonth(today),'yyyy-MM-dd'))
        .lte('appointment_date', format(endOfMonth(today),'yyyy-MM-dd'))
    }

    const { data } = await query
    const all = data || []
    setRows(all)

    const dayCounts = {}
    all.forEach(r => {
      const d = format(new Date(r.appointment_date), 'MMM d')
      dayCounts[d] = (dayCounts[d] || 0) + Number(r.amount_tsh || 0)
    })
    setDailyChart(Object.entries(dayCounts).slice(0,14).reverse()
      .map(([date, total]) => ({ date, total })))

    const pmCounts = {}
    all.forEach(r => {
      const pm = r.payment_method || 'unknown'
      pmCounts[pm] = (pmCounts[pm] || 0) + Number(r.amount_tsh || 0)
    })
    setPayPie(Object.entries(pmCounts).map(([name, value]) => ({ name, value })))
    setLoading(false)
  }, [range])

  // Load claims
  const loadClaims = useCallback(async () => {
    setClaimsLoad(true)
    const { data } = await db.from('insurance_claims')
      .select(`*, appointment_count:insurance_claim_appointments(count)`)
      .order('created_at', { ascending: false })
    setClaims((data || []).map(c => ({
      ...c,
      appointment_count: c.appointment_count?.[0]?.count ?? 0,
    })))
    setClaimsLoad(false)
  }, [])

  useEffect(() => { loadRevenue() }, [loadRevenue])
  useEffect(() => { loadClaims()  }, [loadClaims])

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || r.patient?.full_name?.toLowerCase().includes(q)
      || r.doctor?.full_name?.toLowerCase().includes(q) || r.patient?.phone?.includes(q)
    return matchQ && (payFilter === 'all' || r.payment_method === payFilter)
  })

  const totalRevenue   = filtered.reduce((s,r) => s + Number(r.amount_tsh||0), 0)
  const cashRevenue    = filtered.filter(r=>r.payment_method==='cash').reduce((s,r)=>s+Number(r.amount_tsh||0),0)
  const insuranceRevenue = filtered.filter(r=>INSURERS.includes(r.payment_method)).reduce((s,r)=>s+Number(r.amount_tsh||0),0)
  const mobileRevenue  = filtered.filter(r=>MOBILE.includes(r.payment_method)).reduce((s,r)=>s+Number(r.amount_tsh||0),0)

  const filteredClaims = claims.filter(c => claimFilter === 'all' || c.status === claimFilter)

  const pendingClaimsTotal = claims
    .filter(c => c.status === 'submitted' || c.status === 'partially_paid')
    .reduce((s,c) => s + Number(c.total_claimed||0) - Number(c.total_paid||0), 0)

  const rangeBtnCls = active =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
      active ? 'bg-green-700 text-white border-green-700'
             : 'bg-white text-gray-500 border-gray-200 hover:border-green-400'}`

  const tabCls = active =>
    `px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      active ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`

  const sel = "px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-green-600"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Revenue</h1>
          <p className="text-gray-400 text-sm mt-0.5">Financial overview · Daktari Tanzania</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {tab === 'overview' && [['today','Today'],['week','This Week'],['month','This Month'],['all','All Time']].map(([v,l]) => (
            <button key={v} className={rangeBtnCls(range===v)} onClick={() => setRange(v)}>{l}</button>
          ))}
          {tab === 'claims' && (
            <button onClick={() => setShowNew(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background:'#0D5C4A' }}>
              + New Claim Batch
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-100 rounded-2xl p-1 inline-flex gap-1">
        <button className={tabCls(tab==='overview')} onClick={() => setTab('overview')}>📊 Overview</button>
        <button className={tabCls(tab==='claims')}   onClick={() => setTab('claims')}>
          🏥 Insurance Claims
          {claims.filter(c=>c.status==='submitted').length > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {claims.filter(c=>c.status==='submitted').length}
            </span>
          )}
        </button>
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {tab === 'overview' && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon="💰" label="Total Revenue"      value={fmtTsh(totalRevenue)}     color="#0D5C4A"/>
          <SummaryCard icon="💵" label="Cash"               value={fmtTsh(cashRevenue)}      color="#607D8B"
            sub={`${filtered.filter(r=>r.payment_method==='cash').length} transactions`}/>
          <SummaryCard icon="🏥" label="Insurance Billed"   value={fmtTsh(insuranceRevenue)} color="#9C27B0"
            sub="NHIF · Sanlam · Jubilee · Strategis"/>
          <SummaryCard icon="📱" label="Mobile Money"       value={fmtTsh(mobileRevenue)}    color="#2196F3"
            sub="M-Pesa · Tigo · Airtel"/>
        </div>

        {pendingClaimsTotal > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="text-2xl">⏳</div>
            <div className="flex-1">
              <div className="font-bold text-yellow-800">Outstanding Insurance Claims</div>
              <div className="text-sm text-yellow-700">
                {fmtTsh(pendingClaimsTotal)} pending from insurance companies ·{' '}
                <button className="underline font-semibold" onClick={() => setTab('claims')}>
                  View Claims →
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="font-bold text-gray-800 mb-4">Revenue Over Time</h3>
            {dailyChart.length === 0
              ? <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No data</div>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="date" tick={{ fontSize:11, fill:'#9CA3AF' }}/>
                    <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} tick={{ fontSize:11, fill:'#9CA3AF' }}/>
                    <Tooltip formatter={v=>fmtTsh(v)} contentStyle={{ borderRadius:12, fontSize:13 }}/>
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
                      {payPie.map((e,i) => <Cell key={i} fill={INSURER_COLORS[e.name]||'#9CA3AF'}/>)}
                    </Pie>
                    <Legend formatter={v=><span style={{fontSize:11}}>{cap(v)}</span>}/>
                    <Tooltip formatter={v=>fmtTsh(v)} contentStyle={{ borderRadius:12, fontSize:13 }}/>
                  </PieChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Transactions table */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex gap-3 mb-5 flex-wrap items-center justify-between">
            <h3 className="font-bold text-gray-800">Transactions</h3>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                <input className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                  outline-none focus:border-green-600 w-52" placeholder="Search..."
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <select className={sel} value={payFilter} onChange={e => setPayFilter(e.target.value)}>
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="tigo_pesa">Tigo Pesa</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="nhif">NHIF</option>
                <option value="sanlam">Sanlam</option>
                <option value="jubilee">Jubilee</option>
                <option value="strategis">Strategis</option>
              </select>
              <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
                onClick={loadRevenue}>🔄</button>
            </div>
          </div>
          {loading
            ? <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>Loading...
              </div>
            : filtered.length === 0
            ? <div className="text-center py-14 text-gray-300"><div className="text-4xl mb-2">💰</div>No transactions</div>
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
                              text-white text-xs font-bold"
                              style={{ background:r.doctor?.color_hex||'#0D5C4A' }}>
                              {r.doctor?.initials||'?'}
                            </div>
                            <span className="text-xs">{r.doctor?.full_name||'—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 border-b border-gray-50 text-sm">{fmtDate(r.appointment_date)}</td>
                        <td className="px-4 py-3.5 border-b border-gray-50 font-bold text-sm" style={{color:'#0D5C4A'}}>
                          {fmtTsh(r.amount_tsh)}
                        </td>
                        <td className="px-4 py-3.5 border-b border-gray-50">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                            text-xs font-bold capitalize"
                            style={{ background: (INSURER_COLORS[r.payment_method]||'#9CA3AF')+'22',
                                     color: INSURER_COLORS[r.payment_method]||'#607D8B' }}>
                            {cap(r.payment_method)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 border-b border-gray-50">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            r.payment_status==='paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.payment_status||'unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </>}

      {/* ── CLAIMS TAB ───────────────────────────────────────────────────── */}
      {tab === 'claims' && <>
        {/* Claims summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard icon="📋" label="Total Batches"    value={claims.length}                                         color="#0D5C4A"/>
          <SummaryCard icon="⏳" label="Awaiting Payment" value={claims.filter(c=>c.status==='submitted').length}       color="#F4B942"/>
          <SummaryCard icon="✅" label="Settled"          value={claims.filter(c=>c.status==='paid').length}            color="#2D4A8A"/>
          <SummaryCard icon="💸" label="Outstanding"      value={fmtTsh(pendingClaimsTotal)}                           color="#E84545"
            sub="across all open claims"/>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 flex-wrap items-center">
          <span className="text-sm font-semibold text-gray-500">Filter:</span>
          {[['all','All'],['submitted','Submitted'],['partially_paid','Partial'],['paid','Paid'],['rejected','Rejected']].map(([v,l]) => (
            <button key={v}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                claimFilter===v ? 'bg-green-700 text-white border-green-700'
                                : 'text-gray-500 border-gray-200 hover:border-green-400'}`}
              onClick={() => setClaimFilter(v)}>{l}</button>
          ))}
          <div className="ml-auto">
            <button onClick={loadClaims} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">🔄</button>
          </div>
        </div>

        {/* Claims list */}
        {claimsLoad
          ? <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>Loading...
            </div>
          : filteredClaims.length === 0
          ? <div className="text-center py-14 text-gray-300 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-2">🏥</div>No claim batches yet
            </div>
          : <div className="space-y-3">
              {filteredClaims.map(c => (
                <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: INSURER_COLORS[c.insurer]||'#9CA3AF' }}>
                        {c.insurer?.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-base">{cap(c.insurer)}</div>
                        <div className="text-xs text-gray-400">
                          {fmtDate(c.period_start)} – {fmtDate(c.period_end)} · {c.appointment_count} appointments
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Submitted {fmtDate(c.submitted_at?.substring(0,10))}
                          {c.paid_at && ` · Paid ${fmtDate(c.paid_at)}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Claimed</div>
                        <div className="font-bold text-base">{fmtTsh(c.total_claimed)}</div>
                      </div>
                      {c.total_paid != null && (
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Received</div>
                          <div className="font-bold text-base" style={{ color:'#0D5C4A' }}>{fmtTsh(c.total_paid)}</div>
                        </div>
                      )}
                      <StatusBadge status={c.status}/>
                      <div className="flex gap-2">
                        <button onClick={() => setDetailModal(c)}
                          className="px-3 py-1.5 text-xs font-semibold border border-gray-200
                            rounded-lg text-gray-600 hover:border-gray-400 transition-all">
                          View Details
                        </button>
                        {(c.status === 'submitted' || c.status === 'partially_paid') && (
                          <button onClick={() => setPayModal(c)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all"
                            style={{ background:'#0D5C4A' }}>
                            Record Payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar for partial payments */}
                  {c.status === 'partially_paid' && c.total_paid && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Payment progress</span>
                        <span>{Math.round(Number(c.total_paid)/Number(c.total_claimed)*100)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          background:'#F4B942',
                          width:`${Math.min(100, Math.round(Number(c.total_paid)/Number(c.total_claimed)*100))}%`
                        }}/>
                      </div>
                    </div>
                  )}

                  {c.notes && (
                    <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      📝 {c.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
        }
      </>}

      {/* Modals */}
      {showNew    && <NewClaimModal    onClose={() => setShowNew(false)}    onSaved={() => { setShowNew(false);    loadClaims(); loadRevenue() }}/>}
      {payModal   && <RecordPaymentModal claim={payModal} onClose={() => setPayModal(null)}   onSaved={() => { setPayModal(null);   loadClaims(); loadRevenue() }}/>}
      {detailModal&& <ClaimDetailModal  claim={detailModal} onClose={() => setDetailModal(null)}/>}
    </div>
  )
}