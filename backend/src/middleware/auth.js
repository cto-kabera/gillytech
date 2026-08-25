import { supabaseAdmin } from '../db/supabase.js'

export async function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = header.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from('users')
    .select('id, role, name, email, school_id, avatar, subject')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile) {
    return res.status(401).json({ error: 'Profile not found. Confirm the auth.users → public.users trigger is installed.' })
  }

  req.user = profile
  next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
