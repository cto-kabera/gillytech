import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { setToken, clearToken } from '../lib/api'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, 
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token)
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token)
      } else {
        clearToken()
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
    if (!error && data) setUser(data)
    setLoading(false)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    setToken(data.session.access_token)
    
    // Fetch custom profile data (role, name)
    const { data: profile } = await supabase.from('users').select('*').eq('id', data.user.id).single()
    setUser(profile)
    return profile
  }

  async function logout() { 
    await supabase.auth.signOut()
    clearToken()
    setUser(null) 
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)