import { Router } from 'express'
import { auth, requireRole } from '../middleware/auth.js'
import { supabaseAdmin } from '../db/supabase.js'
import { initialsFromName, joinCode } from '../lib/access.js'

export const adminRouter = Router()
adminRouter.use(auth, requireRole('admin'))

adminRouter.get('/overview', async (req, res) => {
  const [
    { count: schools }, { count: teachers }, { count: students },
    { count: classes }, { count: sessions },
    { data: active_sessions }, { data: submissions }, { count: badges_awarded },
    { data: recentSessions }, { data: teacherData }
  ] = await Promise.all([
    supabaseAdmin.from('schools').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabaseAdmin.from('classes').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sessions').select('id').eq('status', 'active'),
    supabaseAdmin.from('submissions').select('is_correct, score'),
    supabaseAdmin.from('badges').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('sessions').select('*, classes(name), users!teacher_id(name)').order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('users').select('*, classes(count)').eq('role', 'teacher')
  ])

  const accuracy = submissions?.length
    ? Math.round(submissions.filter(s => s.is_correct).length / submissions.length * 100)
    : 0

  res.json({
    stats: {
      schools: schools || 0,
      teachers: teachers || 0,
      students: students || 0,
      classes: classes || 0,
      sessions: sessions || 0,
      active_sessions: active_sessions?.length || 0,
      total_submissions: submissions?.length || 0,
      overall_accuracy: accuracy,
      badges_awarded: badges_awarded || 0
    },
    recentSessions: (recentSessions || []).map(s => ({
      ...s,
      class_name: s.classes?.name,
      teacher_name: s.users?.name,
      submission_count: 0
    })),
    teachers: (teacherData || []).map(t => ({
      ...t,
      class_count: t.classes?.[0]?.count || 0,
      session_count: 0
    }))
  })
})

adminRouter.get('/subjects', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('subjects').select('*').order('name')
  if (error) return res.status(500).json({ error: error.message })
  res.json({ subjects: data || [] })
})

adminRouter.post('/subjects', async (req, res) => {
  const { name, school_id } = req.body || {}
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  let schoolId = school_id || req.user.school_id
  if (!schoolId) {
    const { data: school } = await supabaseAdmin.from('schools').select('id').limit(1).maybeSingle()
    schoolId = school?.id || null
  }
  const { data, error } = await supabaseAdmin
    .from('subjects')
    .insert({ name: name.trim(), school_id: schoolId })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ subject: data })
})

adminRouter.get('/users', async (req, res) => {
  let q = supabaseAdmin
    .from('users')
    .select('id, name, email, role, avatar, subject, school_id, created_at, teacher_subjects(subject_id, subjects(id, name))')
    .order('created_at', { ascending: false })
  if (req.query.role) q = q.eq('role', req.query.role)
  const { data, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json({
    users: (data || []).map(u => ({
      ...u,
      subjects: (u.teacher_subjects || []).map(ts => ts.subjects).filter(Boolean)
    }))
  })
})

adminRouter.post('/users', async (req, res) => {
  const { email, password, name, role, subject_ids } = req.body || {}
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, and role are required' })
  }
  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be student, teacher, or admin' })
  }

  const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role }
  })
  if (authErr) return res.status(400).json({ error: authErr.message })

  const ids = Array.isArray(subject_ids) ? subject_ids.filter(Boolean) : []
  if (role === 'teacher' && ids.length) {
    await supabaseAdmin.from('teacher_subjects').insert(
      ids.map(subject_id => ({ teacher_id: created.user.id, subject_id }))
    )
    const { data: first } = await supabaseAdmin.from('subjects').select('name').eq('id', ids[0]).single()
    await supabaseAdmin.from('users').update({
      subject: first?.name || null,
      avatar: initialsFromName(name, email),
      school_id: req.user.school_id
    }).eq('id', created.user.id)
  } else {
    await supabaseAdmin.from('users').update({
      avatar: initialsFromName(name, email),
      school_id: req.user.school_id
    }).eq('id', created.user.id)
  }

  const { data: profile } = await supabaseAdmin.from('users').select('*').eq('id', created.user.id).single()
  res.json({ user: profile })
})

adminRouter.patch('/users/:id', async (req, res) => {
  const { subject_ids } = req.body || {}
  const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', req.params.id).single()
  if (!user) return res.status(404).json({ error: 'User not found' })
  if (user.role !== 'teacher') return res.status(400).json({ error: 'Subjects can only be assigned to teachers' })

  const ids = Array.isArray(subject_ids) ? subject_ids.filter(Boolean) : []
  await supabaseAdmin.from('teacher_subjects').delete().eq('teacher_id', user.id)
  if (ids.length) {
    await supabaseAdmin.from('teacher_subjects').insert(ids.map(subject_id => ({ teacher_id: user.id, subject_id })))
    const { data: first } = await supabaseAdmin.from('subjects').select('name').eq('id', ids[0]).single()
    await supabaseAdmin.from('users').update({ subject: first?.name || null }).eq('id', user.id)
  }
  res.json({ ok: true })
})

adminRouter.delete('/users/:id', async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' })
  const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id)
  if (error) return res.status(400).json({ error: error.message })
  res.json({ ok: true })
})

adminRouter.get('/classes', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('classes')
    .select('*, subjects(id, name), users!teacher_id(id, name, email), enrollments(count)')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({
    classes: (data || []).map(c => ({
      ...c,
      subject_name: c.subjects?.name || c.subject,
      teacher_name: c.users?.name,
      enrolled: c.enrollments?.[0]?.count || 0
    }))
  })
})

adminRouter.post('/classes', async (req, res) => {
  const { name, grade_level, teacher_id, subject_id } = req.body || {}
  if (!name || !teacher_id) return res.status(400).json({ error: 'name and teacher_id required' })

  const { data: teacher } = await supabaseAdmin.from('users').select('*').eq('id', teacher_id).single()
  if (!teacher || teacher.role !== 'teacher') return res.status(400).json({ error: 'teacher_id must be a teacher' })

  let subjectName = ''
  if (subject_id) {
    const { data: subject } = await supabaseAdmin.from('subjects').select('*').eq('id', subject_id).single()
    subjectName = subject?.name || ''
    await supabaseAdmin.from('teacher_subjects').upsert(
      { teacher_id, subject_id },
      { onConflict: 'teacher_id,subject_id' }
    )
  }

  const { data: cls, error } = await supabaseAdmin
    .from('classes')
    .insert({
      teacher_id,
      school_id: teacher.school_id || req.user.school_id,
      name,
      grade_level,
      subject_id: subject_id || null,
      subject: subjectName,
      join_code: joinCode(subjectName || name)
    })
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ class: cls })
})

adminRouter.post('/classes/:id/enroll', async (req, res) => {
  const { student_ids, emails } = req.body || {}
  const { data: cls } = await supabaseAdmin.from('classes').select('*').eq('id', req.params.id).single()
  if (!cls) return res.status(404).json({ error: 'Class not found' })

  const ids = new Set(Array.isArray(student_ids) ? student_ids : [])

  if (typeof emails === 'string' && emails.trim()) {
    const list = emails.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(Boolean)
    if (list.length) {
      const { data: found } = await supabaseAdmin.from('users').select('id, email').eq('role', 'student').in('email', list)
      for (const u of found || []) ids.add(u.id)
    }
  }

  if (!ids.size) return res.status(400).json({ error: 'Provide student_ids or emails' })

  const rows = [...ids].map(student_id => ({ class_id: cls.id, student_id }))
  const { error } = await supabaseAdmin.from('enrollments').upsert(rows, { onConflict: 'class_id,student_id' })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ enrolled: rows.length })
})
