import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { setToken, clearToken } from '../lib/api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback(async (session) => {
    if (!session) {
      clearToken()
      setUser(null)
      setLoading(false)
      return
    }

    setToken(session.access_token)

    const { data, error } = await supabase
      .from('users')
      .select('id, role, name, email, school_id, avatar, subject')
      .eq('id', session.user.id)
      .single()

    if (error || !data) {
      setUser(null)
      setLoading(false)
      return
    }

    setUser(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) applySession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [applySession])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // #region agent log
    fetch('http://127.0.0.1:7852/ingest/afc955dc-9d20-480c-ae49-585cc1d8bbca',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d36a5'},body:JSON.stringify({sessionId:'4d36a5',runId:'login-404',hypothesisId:'C',location:'useAuth.jsx:login',message:'signInWithPassword result',data:{ok:!error,status:error?.status??null,name:error?.name??null,hasSession:Boolean(data?.session)},timestamp:Date.now()})}).catch(()=>{})
    // #endregion
    if (error) throw error
    if (!data.session) throw new Error('No session returned from Supabase Auth')

    setToken(data.session.access_token)

    const { data: profile, error: profileErr } = await supabase
      .from('users')
      .select('id, role, name, email, school_id, avatar, subject')
      .eq('id', data.user.id)
      .single()

    if (profileErr || !profile) {
      throw new Error('Profile not found. Apply the SQL migration so auth.users syncs to public.users.')
    }

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
