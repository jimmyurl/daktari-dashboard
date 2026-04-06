import { createContext, useContext, useEffect, useState } from 'react'
import { db } from './supabase'
const AuthContext = createContext(null)
const SESSION_KEY = 'daktari_admin_session'
export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(undefined)
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.expires_at && new Date(parsed.expires_at) > new Date()) {
          setAdmin(parsed.admin)
        } else { localStorage.removeItem(SESSION_KEY); setAdmin(null) }
      } catch { localStorage.removeItem(SESSION_KEY); setAdmin(null) }
    } else { setAdmin(null) }
  }, [])
  const signIn = async (email, password) => {
    const { data, error } = await db.rpc('admin_login', {
      p_email: email.trim().toLowerCase(), p_password: password })
    if (error) throw new Error('Login failed: ' + error.message)
    if (!data || data.length === 0) throw new Error('Invalid email or password.')
    const adminData = data[0]
    if (!adminData.is_active) throw new Error('Account deactivated.')
    const session = { admin: adminData,
      expires_at: new Date(Date.now() + 24*60*60*1000).toISOString() }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setAdmin(adminData)
    return adminData
  }
  const signOut = () => { localStorage.removeItem(SESSION_KEY); setAdmin(null) }
  return <AuthContext.Provider value={{ admin, signIn, signOut }}>{children}</AuthContext.Provider>
}
export const useAuth = () => useContext(AuthContext)
