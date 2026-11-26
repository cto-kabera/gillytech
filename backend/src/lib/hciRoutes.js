import { supabaseAdmin } from '../db/supabase.js'
import { aggregateHciDashboard } from './hci.js'

const SUB_SELECT = `
  id, session_id, student_id, is_correct, hci, created_at,
  sessions(id, title, teacher_id, started_at, class_id),
  users(id, name, email)
`

export async function fetchHciOverview({ sessionId, teacherId } = {}) {
  let sessQ = supabaseAdmin.from('sessions').select('id, title, teacher_id, started_at, class_id')
  if (sessionId) sessQ = sessQ.eq('id', sessionId)
  if (teacherId) sessQ = sessQ.eq('teacher_id', teacherId)
  const { data: sessions, error: sErr } = await sessQ
  if (sErr) throw sErr
  const sessionIds = (sessions || []).map(s => s.id)
  if (sessionId && !sessionIds.length) {
    return aggregateHciDashboard({ submissions: [], surveys: [], sessions: [] })
  }

  let subQ = supabaseAdmin
    .from('submissions')
    .select(SUB_SELECT)
    .not('hci', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500)
  if (sessionIds.length) subQ = subQ.in('session_id', sessionIds)

  const { data: submissions, error: subErr } = await subQ
  if (subErr) throw subErr

  let survQ = supabaseAdmin.from('hci_surveys').select('*').order('created_at', { ascending: false })
  if (sessionIds.length) survQ = survQ.in('session_id', sessionIds)
  const { data: surveys, error: survErr } = await survQ
  if (survErr) throw survErr

  return aggregateHciDashboard({
    submissions: submissions || [],
    surveys: surveys || [],
    sessions: sessions || []
  })
}