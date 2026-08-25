import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(raw) {
  let value = String(raw || '').trim().replace(/^['"]|['"]$/g, '')
  if (!value) return ''
  if (!value.includes('://') && /^[a-z0-9]+$/i.test(value)) {
    value = `https://${value}.supabase.co`
  }
  const parsed = new URL(value)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('VITE_SUPABASE_URL must be the https API URL, not a postgres:// connection string.')
  }
  const path = parsed.pathname.replace(/\/+$/, '')
  if (path && path !== '/rest/v1' && path !== '/auth/v1') {
    throw new Error(`VITE_SUPABASE_URL must have no extra path (got ${parsed.pathname}). Use https://<project-ref>.supabase.co`)
  }
  return `${parsed.protocol}//${parsed.host}`
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const url = normalizeSupabaseUrl(rawUrl)
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

// #region agent log
try {
  const raw = new URL(String(rawUrl || '').trim())
  fetch('http://127.0.0.1:7852/ingest/afc955dc-9d20-480c-ae49-585cc1d8bbca',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d36a5'},body:JSON.stringify({sessionId:'4d36a5',runId:'login-path',hypothesisId:'C',location:'frontend/src/lib/supabase.js',message:'normalized supabase url',data:{rawHost:raw.host,rawPath:raw.pathname,normalizedHost:new URL(url).host},timestamp:Date.now()})}).catch(()=>{})
} catch (_) {}
// #endregion

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
