import { useEffect, useState, useCallback } from 'react'
import { db } from '../lib/supabase'
import toast from 'react-hot-toast'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  const [doctors,     setDoctors]     = useState([])
  const [hospitals,   setHospitals]   = useState([])
  const [specialties, setSpecialties] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [form, setForm] = useState({
    full_name:'', initials:'', specialty_id:'', hospital_id:'',
    consultation_fee:'30000', experience_years:'', bio:'', color_hex:'#0D5C4A'
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [d, h, s] = await Promise.all([
      db.from('doctors_full').select('*').order('rating', { ascending: false }),
      db.from('hospitals').select('id,name'),
      db.from('specialties').select('id,name,icon'),
    ])
    if (d.data) setDoctors(d.data)
    if (h.data) setHospitals(h.data)
    if (s.data) setSpecialties(s.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleAvailable = async (id, current) => {
    const { error } = await db.from('doctors').update({ is_available: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success(`Doctor ${!current ? 'enabled' : 'disabled'}`)
    load()
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    const { error } = await db.from('doctors').insert({
      ...form,
      consultation_fee: parseInt(form.consultation_fee) || 30000,
      experience_years: parseInt(form.experience_years) || 0,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Doctor added!')
    setShowAdd(false)
    setForm({ full_name:'', initials:'', specialty_id:'', hospital_id:'',
      consultation_fee:'30000', experience_years:'', bio:'', color_hex:'#0D5C4A' })
    load()
  }

  const filtered = doctors.filter(d =>
    !search || d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.hospital_name?.toLowerCase().includes(search.toLowerCase()))

  const inp = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-600 bg-white"

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold">Doctors</h1>
          <p className="text-gray-400 text-sm">{doctors.length} specialists</p>
        </div>
        <button className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background:'#0D5C4A' }} onClick={() => setShowAdd(true)}>
          ＋ Add Doctor
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
              outline-none focus:border-green-600" placeholder="Search..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm
            text-gray-600" onClick={load}>🔄</button>
        </div>
        {loading
          ? <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"/>
              Loading...
            </div>
          : <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr>
                  {['Doctor','Specialty','Hospital','Rating','Fee (TSh)','Status','Action'].map(h =>
                    <th key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wider
                      px-4 py-3 text-left bg-gray-50">{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center
                            text-white font-bold text-sm" style={{ background:d.color_hex||'#0D5C4A' }}>
                            {d.initials}
                          </div>
                          <div className="font-semibold text-sm">{d.full_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                          {d.specialty_icon} {d.specialty_name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 text-xs text-gray-600">{d.hospital_name}</td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className="text-yellow-500 font-bold">★</span>
                        <span className="font-bold ml-1 text-sm">{d.rating}</span>
                        <span className="text-gray-400 text-xs"> ({d.review_count})</span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50 font-semibold text-sm">
                        {Number(d.consultation_fee).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold
                          ${d.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.is_available ? '● Available' : '○ Off'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 border-b border-gray-50">
                        <button className="text-xs py-1.5 px-3 border border-gray-200 rounded-lg
                          text-gray-600 hover:border-gray-400"
                          onClick={() => toggleAvailable(d.id, d.is_available)}>
                          {d.is_available ? '⛔ Disable' : '✓ Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {showAdd && (
        <Modal title="Add New Doctor" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                <input className={inp} required placeholder="Dr. First Last"
                  value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Initials *</label>
                <input className={inp} required placeholder="FL" maxLength={3}
                  value={form.initials} onChange={e => setForm({...form,initials:e.target.value})}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Specialty *</label>
                <select className={inp} required value={form.specialty_id}
                  onChange={e => setForm({...form,specialty_id:e.target.value})}>
                  <option value="">Select...</option>
                  {specialties.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Hospital *</label>
                <select className={inp} required value={form.hospital_id}
                  onChange={e => setForm({...form,hospital_id:e.target.value})}>
                  <option value="">Select...</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fee (TSh) *</label>
                <input className={inp} type="number" required value={form.consultation_fee}
                  onChange={e => setForm({...form,consultation_fee:e.target.value})}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Experience (yrs)</label>
                <input className={inp} type="number" placeholder="0" value={form.experience_years}
                  onChange={e => setForm({...form,experience_years:e.target.value})}/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Bio</label>
              <textarea className={inp} rows={3} style={{resize:'vertical'}} value={form.bio}
                onChange={e => setForm({...form,bio:e.target.value})}/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Avatar Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color_hex}
                  onChange={e => setForm({...form,color_hex:e.target.value})}
                  className="h-10 w-16 rounded-lg border border-gray-200 p-1 cursor-pointer"/>
                <span className="text-sm text-gray-500">{form.color_hex}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="flex-1 py-2.5 border border-gray-200 rounded-xl
                text-sm text-gray-600" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background:'#0D5C4A' }}>Add Doctor</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
