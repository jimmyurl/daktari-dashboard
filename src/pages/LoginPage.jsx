import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPass, setShowPass] = useState(false)
  const { signIn } = useAuth()
  const navigate   = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0D5C4A 0%, #1A8A6C 100%)' }}>

      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center
            justify-center text-3xl shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0D5C4A, #1A8A6C)',
              boxShadow: '0 8px 24px rgba(13,92,74,.35)' }}>
            🏥
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Daktari Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Control Panel · Tanzania 🇹🇿</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3
            text-sm text-red-700 mb-5 flex gap-2 items-start">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase
              tracking-wide mb-1.5">Email Address</label>
            <input
              type="email"
              required
              autoFocus
              placeholder="admin@daktari.co.tz"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                outline-none focus:border-green-600 transition-colors bg-white"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase
              tracking-wide mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                  outline-none focus:border-green-600 transition-colors bg-white pr-12"
              />
              <button type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                  hover:text-gray-600 text-lg"
                onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl font-bold text-white text-base
              transition-all duration-150 mt-2"
            style={{
              background: (loading || !email || !password)
                ? '#D1D5DB'
                : 'linear-gradient(135deg, #0D5C4A, #1A8A6C)',
              boxShadow: (loading || !email || !password)
                ? 'none'
                : '0 6px 20px rgba(13,92,74,.35)',
              cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer'
            }}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white
                    rounded-full animate-spin inline-block"/>
                  Signing in...
                </span>
              : '🔐 Sign In'
            }
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">First time setup:</p>
          <p>1. Run <code className="bg-gray-200 px-1 rounded">admin_users.sql</code> in Supabase SQL Editor</p>
          <p>2. It creates your admin account automatically</p>
          <p>3. Sign in with: <strong>jpmpanga@gmail.com</strong> / <strong>REDACTED</strong></p>
        </div>
      </div>
    </div>
  )
}
