import { supabaseAdmin } from '../db/supabase.js'

export async function studentGroupForSession(studentId, sessionId) {
  const { data: groups } = await supabaseAdmin
    .from('groups')
    .select('id, name, color, session_id')
    .eq('session_id', sessionId)

  if (!groups?.length) return { group: null, membership: null }

  const groupIds = groups.map(g => g.id)
  const { data: membership } = await supabaseAdmin
    .from('group_members')
    .select('group_id, student_id')
    .eq('student_id', studentId)
    .in('group_id', groupIds)
    .maybeSingle()

  const group = membership ? groups.find(g => g.id === membership.group_id) : null
  return { group: group || null, membership: membership || null }
}

export async function groupMates(groupId, excludeStudentId) {
  if (!groupId) return []
  const { data: members } = await supabaseAdmin
    .from('group_members')
    .select('student_id, users(id, name, avatar)')
    .eq('group_id', groupId)

  return (members || [])
    .map(m => m.users)
    .filter(u => u && u.id !== excludeStudentId)
}

export function clientQuestion(q) {
  if (!q) return null
  const { correct_answer, ...safe } = q
  return safe
}

export async function assignToSmallestGroup(sessionId, studentId) {
  const { data: groups } = await supabaseAdmin
    .from('groups')
    .select('id, group_members(count)')
    .eq('session_id', sessionId)

  if (!groups?.length) {
    const { data: created } = await supabaseAdmin
      .from('groups')
      .insert({ session_id: sessionId, name: 'Group A', formed_by: 'auto', color: '#2563eb' })
      .select()
      .single()
    if (!created) return null
    await supabaseAdmin.from('group_members').insert({ group_id: created.id, student_id: studentId })
    return created
  }

  const ranked = groups
    .map(g => ({ id: g.id, count: g.group_members?.[0]?.count || 0 }))
    .sort((a, b) => a.count - b.count)

  const target = ranked[0]
  await supabaseAdmin.from('group_members').insert({ group_id: target.id, student_id: studentId })
  const { data: group } = await supabaseAdmin.from('groups').select('*').eq('id', target.id).single()
  return group
}

export function initialsFromName(name, email) {
  const display = name || splitEmail(email)
  const letters = (display.match(/[A-Za-z]/g) || []).join('')
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase()
  return (display || '??').slice(0, 2).toUpperCase()
}

function splitEmail(email) {
  return (email || 'user').split('@')[0]
}

export function joinCode(subjectName) {
  const prefix = (subjectName || 'STEM').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'STM'
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`
}

export async function teacherSubjectIds(teacherId) {
  const { data } = await supabaseAdmin.from('teacher_subjects').select('subject_id').eq('teacher_id', teacherId)
  return (data || []).map(r => r.subject_id)
}
