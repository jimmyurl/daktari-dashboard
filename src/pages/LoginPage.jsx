import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [tab,        setTab]        = useState('login')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [name,       setName]       = useState('')
  const [otp,        setOtp]        = useState(['', '', '', '', '', ''])
  const [otpSent,    setOtpSent]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [googleLoad, setGoogleLoad] = useState(false)
  const [error,      setError]      = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const clearError = () => setError('')

  // ── Google OAuth ───────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoad(true); clearError()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      setGoogleLoad(false)
    }
  }

  // ── Login ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); clearError()
    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP ────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true); clearError()
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setOtpSent(true)
      toast.success('OTP sent to ' + email)
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const token = otp.join('')
    if (token.length < 6) return
    setLoading(true); clearError()
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
      if (error) throw error
      toast.success('Verified!')
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpInput = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus()
  }

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus()
  }

  // ── Signup ─────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setLoading(true); clearError()
    try {
      // Replace with your actual create_admin_user logic
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Account requested! Awaiting super admin approval.')
      setTab('login')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────
  const btnStyle = (disabled) => ({
    background: disabled ? '#D1D5DB' : 'linear-gradient(135deg, #0D5C4A, #1A8A6C)',
    boxShadow:  disabled ? 'none'    : '0 6px 20px rgba(13,92,74,.35)',
    cursor:     disabled ? 'not-allowed' : 'pointer',
  })

  const inputCls = `w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
    outline-none focus:border-green-600 transition-colors bg-white`

  const labelCls = `block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5`

  const Divider = () => (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium">or continue with email</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )

  const GoogleBtn = () => (
    <button type="button" onClick={handleGoogle} disabled={googleLoad}
      className="w-full flex items-center justify-center gap-3 py-3 px-4
        border border-gray-200 rounded-xl text-sm font-semibold text-gray-700
        hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 bg-white"
      style={{ cursor: googleLoad ? 'not-allowed' : 'pointer', opacity: googleLoad ? 0.7 : 1 }}>
      {googleLoad
        ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        : (
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
        )
      }
      {googleLoad ? 'Redirecting to Google...' : 'Sign in with Google'}
    </button>
  )

  const Spinner = () => (
    <span className="flex items-center justify-center gap-2">
      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block"/>
    </span>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0D5C4A 0%, #1A8A6C 100%)' }}>

      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/daktari-logo-light1.png"
            alt="Daktari Logo"
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-extrabold text-gray-900">Daktari Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Control Panel · Tanzania 🇹🇿</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
          {[['login', '🔐 Login'], ['otp', '📱 OTP'], ['signup', '✍️ Sign Up']].map(([key, label]) => (
            <button key={key} type="button"
              onClick={() => { setTab(key); clearError(); setOtpSent(false) }}
              className="flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150"
              style={{
                background: tab === key ? 'white' : 'transparent',
                color:      tab === key ? '#0D5C4A' : '#9CA3AF',
                boxShadow:  tab === key ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
            text-sm text-red-700 mb-5 flex gap-2 items-start">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── Login ── */}
        {tab === 'login' && (
          <>
            <GoogleBtn />
            <Divider />
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" required autoFocus
                  placeholder="admin@daktari.co.tz"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={inputCls + ' pr-12'} />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 rounded-xl font-bold text-white text-base transition-all duration-150"
                style={btnStyle(loading || !email || !password)}>
                {loading ? <Spinner /> : '🔐 Sign In'}
              </button>
            </form>
          </>
        )}

        {/* ── OTP ── */}
        {tab === 'otp' && (
          <>
            <GoogleBtn />
            <Divider />
            <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" required
                  placeholder="admin@daktari.co.tz"
                  value={email} onChange={e => setEmail(e.target.value)}
                  disabled={otpSent}
                  className={inputCls + (otpSent ? ' opacity-50 cursor-not-allowed' : '')} />
              </div>
              {otpSent && (
                <div>
                  <label className={labelCls}>Enter 6-digit code</label>
                  <div className="flex gap-2 justify-between mt-1">
                    {otp.map((digit, idx) => (
                      <input key={idx} id={`otp-${idx}`}
                        type="text" inputMode="numeric" maxLength={1}
                        value={digit}
                        onChange={e => handleOtpInput(e.target.value, idx)}
                        onKeyDown={e => handleOtpKey(e, idx)}
                        className="w-11 h-12 text-center border border-gray-200 rounded-xl
                          text-lg font-bold outline-none focus:border-green-600 transition-colors" />
                    ))}
                  </div>
                  <button type="button"
                    className="text-xs text-green-700 mt-2 hover:underline"
                    onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}>
                    ← Change email
                  </button>
                </div>
              )}
              <button type="submit"
                disabled={loading || !email || (otpSent && otp.join('').length < 6)}
                className="w-full py-3 rounded-xl font-bold text-white text-base transition-all duration-150"
                style={btnStyle(loading || !email || (otpSent && otp.join('').length < 6))}>
                {loading
                  ? <Spinner />
                  : otpSent ? '✅ Verify Code' : '📱 Send OTP'}
              </button>
            </form>
          </>
        )}

        {/* ── Signup ── */}
        {tab === 'signup' && (
          <>
            <GoogleBtn />
            <Divider />
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" required
                  placeholder="Dr. John Doe"
                  value={name} onChange={e => setName(e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" required
                  placeholder="admin@daktari.co.tz"
                  value={email} onChange={e => setEmail(e.target.value)}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} required
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={inputCls + ' pr-12'} />
                  <button type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                New accounts require approval from a super admin before access is granted.
              </p>
              <button type="submit"
                disabled={loading || !name || !email || !password}
                className="w-full py-3 rounded-xl font-bold text-white text-base transition-all duration-150"
                style={btnStyle(loading || !name || !email || !password)}>
                {loading ? <Spinner /> : '✍️ Request Access'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  )
}