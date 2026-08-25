import '../load-env.js'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

function normalizeSupabaseUrl(raw) {
  let value = String(raw || '').trim().replace(/^['"]|['"]$/g, '')
  if (!value) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!value.includes('://') && /^[a-z0-9]+$/i.test(value)) {
    value = `https://${value}.supabase.co`
  }
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error('SUPABASE_URL must be https://<project-ref>.supabase.co from Project Settings → API (not the database URI).')
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('SUPABASE_URL must be the https API URL, not a postgres:// connection string.')
  }
  const path = parsed.pathname.replace(/\/+$/, '')
  if (path && path !== '/rest/v1' && path !== '/auth/v1') {
    throw new Error(`SUPABASE_URL must have no extra path (got ${parsed.pathname}). Use https://<project-ref>.supabase.co`)
  }
  return `${parsed.protocol}//${parsed.host}`
}

const url = normalizeSupabaseUrl(process.env.SUPABASE_URL)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws }
})
