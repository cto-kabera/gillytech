import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY // Use ANON key, not Service Role!

export async function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  
  const token = authHeader.split(' ')[1]

  // 1. Create a Supabase client scoped strictly to the incoming user's token
  const scopedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  })

  // 2. Verify the token with Supabase Auth
  const { data: { user }, error } = await scopedClient.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Invalid or expired token' })

  // 3. Fetch the user's role from our public table
  const { data: profile } = await scopedClient
    .from('users')
    .select('role, name')
    .eq('id', user.id)
    .single()

  // 4. Attach the user data AND the scoped client to the request
  req.user = { id: user.id, role: profile?.role, name: profile?.name }
  req.supabase = scopedClient 
  
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}