import { Router } from 'express'
import { auth, requireRole } from '../middleware/auth.js'
import { supabaseAdmin } from '../db/supabase.js'
import { teacherSubjectIds } from '../lib/access.js'

export const teacherRouter = Router()
teacherRouter.use(auth, requireRole('teacher', 'admin'))

function teacherFilter(query, user) {
  if (user.role === 'admin') return query
  return query.eq('teacher_id', user.id)
}

teacherRouter.get('/classes', async (req, res) => {
  let q = supabaseAdmin.from('classes').select('*, enrollments(count), sessions(count), subjects(id, name)')
  q = teacherFilter(q, req.user)
  const { data: classes, error } = await q
  if (error) return res.status(500).json({ error: error.message })

  res.json({
    classes: (classes || []).map(c => ({
      ...c,
      subject_name: c.subjects?.name || c.subject,
      enrolled: c.enrollments?.[0]?.count || 0,
      sessions: c.sessions?.[0]?.count || 0
    }))
  })
})

teacherRouter.get('/subjects', async (req, res) => {
  if (req.user.role === 'admin') {
    const { data, error } = await supabaseAdmin.from('subjects').select('*').order('name')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ subjects: data || [] })
  }
  const { data, error } = await supabaseAdmin
    .from('teacher_subjects')
    .select('subject_id, subjects(*)')
    .eq('teacher_id', req.user.id)
  if (error) return res.status(500).json({ error: error.message })
  res.json({ subjects: (data || []).map(r => r.subjects).filter(Boolean) })
})

teacherRouter.patch('/classes/:id', async (req, res) => {
  const { subject_id } = req.body || {}
  if (!subject_id) return res.status(400).json({ error: 'subject_id required' })

  const { data: cls, error: clsErr } = await supabaseAdmin.from('classes').select('*').eq('id', req.params.id).single()
  if (clsErr || !cls) return res.status(404).json({ error: 'Class not found' })
  if (req.user.role !== 'admin' && cls.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const allowed = await teacherSubjectIds(cls.teacher_id)
  if (!allowed.includes(subject_id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You are not assigned to that subject' })
  }

  const { data: subject } = await supabaseAdmin.from('subjects').select('*').eq('id', subject_id).single()
  const { data: updated, error } = await supabaseAdmin
    .from('classes')
    .update({ subject_id, subject: subject?.name || cls.subject })
    .eq('id', req.params.id)
    .select('*, subjects(id, name)')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ class: { ...updated, subject_name: updated.subjects?.name || updated.subject } })
})

teacherRouter.post('/classes', async (req, res) => {
  const { name, grade_level, subject } = req.body || {}
  if (!name) return res.status(400).json({ error: 'Name required' })

  const { data: user } = await supabaseAdmin.from('users').select('school_id').eq('id', req.user.id).single()
  const join_code = `${(subject || 'STEM').slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

  const { data: cls, error } = await supabaseAdmin
    .from('classes')
    .insert({
      teacher_id: req.user.id,
      school_id: user?.school_id || null,
      name,
      grade_level,
      subject,
      join_code
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ class: cls })
})

teacherRouter.get('/classes/:id/students', async (req, res) => {
  const { data: cls, error: clsErr } = await supabaseAdmin.from('classes').select('*').eq('id', req.params.id).single()
  if (clsErr || !cls) return res.status(404).json({ error: 'Class not found' })
  if (req.user.role !== 'admin' && cls.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { data: enrolled } = await supabaseAdmin
    .from('enrollments')
    .select('student_id, users(id, name, email, avatar)')
    .eq('class_id', cls.id)

  const studentIds = (enrolled || []).map(e => e.student_id)
  const [{ data: subs }, { data: badges }] = await Promise.all([
    studentIds.length
      ? supabaseAdmin.from('submissions').select('student_id, score').in('student_id', studentIds)
      : { data: [] },
    studentIds.length
      ? supabaseAdmin.from('badges').select('student_id').in('student_id', studentIds)
      : { data: [] }
  ])

  const scoreMap = {}
  const badgeMap = {}
  for (const s of subs || []) scoreMap[s.student_id] = (scoreMap[s.student_id] || 0) + (s.score || 0)
  for (const b of badges || []) badgeMap[b.student_id] = (badgeMap[b.student_id] || 0) + 1

  res.json({
    students: (enrolled || []).map(e => ({
      ...e.users,
      total_score: scoreMap[e.student_id] || 0,
      badges: badgeMap[e.student_id] || 0
    }))
  })
})

teacherRouter.get('/sessions', async (req, res) => {
  let q = supabaseAdmin
    .from('sessions')
    .select('*, classes(name), questions(count)')
    .order('created_at', { ascending: false })
  q = teacherFilter(q, req.user)
  const { data: sessions, error } = await q
  if (error) return res.status(500).json({ error: error.message })

  const ids = (sessions || []).map(s => s.id)
  const { data: subs } = ids.length
    ? await supabaseAdmin.from('submissions').select('session_id').in('session_id', ids)
    : { data: [] }
  const counts = {}
  for (const s of subs || []) counts[s.session_id] = (counts[s.session_id] || 0) + 1

  res.json({
    sessions: (sessions || []).map(s => ({
      ...s,
      class_name: s.classes?.name,
      question_count: s.questions?.[0]?.count || 0,
      submission_count: counts[s.id] || 0
    }))
  })
})

teacherRouter.post('/sessions', async (req, res) => {
  const { class_id, title, questions, bank_ids } = req.body || {}
  if (!class_id || !title) return res.status(400).json({ error: 'class_id and title required' })

  const { data: cls } = await supabaseAdmin.from('classes').select('*').eq('id', class_id).single()
  if (!cls) return res.status(404).json({ error: 'Class not found' })
  if (req.user.role !== 'admin' && cls.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { data: session, error: sessErr } = await supabaseAdmin
    .from('sessions')
    .insert({ class_id, teacher_id: req.user.id, title, status: 'draft' })
    .select()
    .single()
  if (sessErr) return res.status(500).json({ error: sessErr.message })

  const sessionQuestions = []

  if (bank_ids?.length) {
    const { data: bankRows } = await supabaseAdmin
      .from('question_bank')
      .select('*')
      .in('id', bank_ids)
    for (const q of bankRows || []) {
      if (req.user.role !== 'admin' && q.teacher_id !== req.user.id) continue
      sessionQuestions.push({
        type: q.type,
        marks: q.marks,
        time_limit_sec: 120,
        content_json: q.content_json,
        correct_answer: String(q.correct_answer)
      })
    }
  }

  for (const q of questions || []) {
    const row = {
      type: q.type || 'multiple_choice',
      marks: q.marks ?? 10,
      time_limit_sec: q.time_limit_sec ?? 120,
      content_json: q.content_json || { text: '', options: [] },
      correct_answer: String(q.correct_answer ?? '0')
    }
    sessionQuestions.push(row)
    if (q.save_to_bank !== false && cls.subject_id) {
      const { data: subject } = await supabaseAdmin.from('subjects').select('name').eq('id', cls.subject_id).single()
      await supabaseAdmin.from('question_bank').insert({
        teacher_id: req.user.id,
        subject_id: cls.subject_id,
        subject: subject?.name || cls.subject,
        topic: q.topic || '',
        type: row.type,
        marks: row.marks,
        content_json: row.content_json,
        correct_answer: row.correct_answer
      })
    }
  }

  if (sessionQuestions.length) {
    const qs = sessionQuestions.map((q, i) => ({ session_id: session.id, order_index: i, ...q }))
    const { error: qErr } = await supabaseAdmin.from('questions').insert(qs)
    if (qErr) return res.status(500).json({ error: qErr.message })
  }

  const { data: enrolled } = await supabaseAdmin.from('enrollments').select('student_id').eq('class_id', class_id)
  if (enrolled?.length) {
    const groupColors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']
    const groupSize = 4
    for (let i = 0; i < Math.ceil(enrolled.length / groupSize); i++) {
      const { data: group } = await supabaseAdmin
        .from('groups')
        .insert({
          session_id: session.id,
          name: `Group ${String.fromCharCode(65 + i)}`,
          formed_by: 'auto',
          color: groupColors[i % groupColors.length]
        })
        .select()
        .single()
      const members = enrolled.slice(i * groupSize, (i + 1) * groupSize).map(e => ({
        group_id: group.id,
        student_id: e.student_id
      }))
      if (members.length) await supabaseAdmin.from('group_members').insert(members)
    }
  }

  res.json({ session })
})

teacherRouter.patch('/sessions/:id', async (req, res) => {
  const { data: existing } = await supabaseAdmin.from('sessions').select('*').eq('id', req.params.id).single()
  if (!existing) return res.status(404).json({ error: 'Session not found' })
  if (req.user.role !== 'admin' && existing.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { status, current_question_index } = req.body || {}
  const updateData = {}
  if (status) {
    updateData.status = status
    if (status === 'active') updateData.started_at = new Date().toISOString()
    if (status === 'completed') updateData.ended_at = new Date().toISOString()
  }
  if (current_question_index !== undefined) updateData.current_question_index = current_question_index

  const { data: session, error } = await supabaseAdmin
    .from('sessions')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ session })
})

teacherRouter.get('/sessions/:id/live', async (req, res) => {
  const { data: session } = await supabaseAdmin.from('sessions').select('*').eq('id', req.params.id).single()
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('session_id', session.id)
    .order('order_index', { ascending: true })

  const question_index = session.current_question_index || 0
  const current_question = questions?.[question_index] || null

  const { count: enrolled_count } = await supabaseAdmin
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', session.class_id)

  const { data: groups } = await supabaseAdmin.from('groups').select('*').eq('session_id', session.id)
  const groupIds = (groups || []).map(g => g.id)
  const { data: members } = groupIds.length
    ? await supabaseAdmin.from('group_members').select('group_id').in('group_id', groupIds)
    : { data: [] }

  let currentSubs = []
  if (current_question) {
    const { data } = await supabaseAdmin
      .from('submissions')
      .select('*, users(name, avatar)')
      .eq('question_id', current_question.id)
      .order('created_at', { ascending: true })
    currentSubs = data || []
  }

  const memberCount = {}
  for (const m of members || []) memberCount[m.group_id] = (memberCount[m.group_id] || 0) + 1

  const groupStatus = (groups || []).map(g => {
    const gSubs = currentSubs.filter(s => s.group_id === g.id)
    return {
      id: g.id,
      name: g.name,
      color: g.color,
      member_count: memberCount[g.id] || 0,
      submitted_count: gSubs.length,
      total_score: gSubs.reduce((a, s) => a + (s.score || 0), 0)
    }
  })

  res.json({
    session,
    current_question,
    question_index,
    total_questions: questions?.length || 0,
    enrolled_count: enrolled_count || 0,
    submitted_count: currentSubs.length,
    correct_count: currentSubs.filter(s => s.is_correct).length,
    groupStatus,
    submissions: currentSubs.map(s => ({
      ...s,
      student_name: s.users?.name
    }))
  })
})

teacherRouter.get('/sessions/:id/analytics', async (req, res) => {
  const { data: session } = await supabaseAdmin.from('sessions').select('*').eq('id', req.params.id).single()
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const [{ data: questions }, { count: enrolled }, { data: groups }, { data: enrollments }] = await Promise.all([
    supabaseAdmin.from('questions').select('*').eq('session_id', session.id).order('order_index', { ascending: true }),
    supabaseAdmin.from('enrollments').select('*', { count: 'exact', head: true }).eq('class_id', session.class_id),
    supabaseAdmin.from('groups').select('*').eq('session_id', session.id),
    supabaseAdmin.from('enrollments').select('student_id, users(id, name, avatar)').eq('class_id', session.class_id)
  ])

  const { data: allSubs } = await supabaseAdmin.from('submissions').select('*').eq('session_id', session.id)
  const subs = allSubs || []
  const qList = questions || []
  const studentRows = (enrollments || []).map(e => e.users).filter(Boolean)

  const groupIds = (groups || []).map(g => g.id)
  const { data: members } = groupIds.length
    ? await supabaseAdmin.from('group_members').select('group_id, student_id').in('group_id', groupIds)
    : { data: [] }
  const studentGroup = {}
  for (const m of members || []) {
    const g = (groups || []).find(x => x.id === m.group_id)
    studentGroup[m.student_id] = g
  }

  const byStudent = {}
  for (const s of studentRows) {
    byStudent[s.id] = {
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      group_name: studentGroup[s.id]?.name,
      group_color: studentGroup[s.id]?.color,
      total: 0,
      correct: 0,
      count: 0,
      reasoning_chars: 0
    }
  }
  for (const sub of subs) {
    if (!byStudent[sub.student_id]) continue
    const row = byStudent[sub.student_id]
    row.total += sub.score || 0
    row.count += 1
    if (sub.is_correct) row.correct += 1
    row.reasoning_chars += (sub.reasoning_text || '').length
  }

  const studentLeaderboard = Object.values(byStudent).sort((a, b) => b.total - a.total)
  const active_students = studentLeaderboard.filter(s => s.count > 0).length
  const overall_accuracy = subs.length
    ? Math.round(subs.filter(s => s.is_correct).length / subs.length * 100)
    : 0

  const groupLeaderboard = (groups || []).map(g => {
    const gSubs = subs.filter(s => s.group_id === g.id)
    return {
      id: g.id,
      name: g.name,
      color: g.color,
      total: gSubs.reduce((a, s) => a + (s.score || 0), 0),
      correct: gSubs.filter(s => s.is_correct).length
    }
  }).sort((a, b) => b.total - a.total)

  const questionStats = qList.map(q => {
    const qSubs = subs.filter(s => s.question_id === q.id)
    const option_distribution = {}
    for (const sub of qSubs) {
      const key = sub.answer
      option_distribution[key] = (option_distribution[key] || 0) + 1
    }
    const options = q.content_json?.options || []
    const avg_reasoning_length = qSubs.length
      ? Math.round(qSubs.reduce((a, s) => a + (s.reasoning_text || '').length, 0) / qSubs.length)
      : 0
    return {
      id: q.id,
      text: q.content_json?.text || '',
      options,
      correct_answer: q.correct_answer,
      total_attempts: qSubs.length,
      accuracy: qSubs.length ? Math.round(qSubs.filter(s => s.is_correct).length / qSubs.length * 100) : 0,
      option_distribution,
      avg_reasoning_length
    }
  })

  const qCount = qList.length || 1
  const cbcScores = studentLeaderboard.map(s => ({
    id: s.id,
    name: s.name,
    critical_thinking: s.count ? Math.round((s.correct / s.count) * 100) : 0,
    reasoning: s.count ? Math.min(100, Math.round((s.reasoning_chars / s.count) / 80 * 100)) : 0,
    participation: Math.round((s.count / qCount) * 100)
  }))

  res.json({
    session,
    enrolled: enrolled || 0,
    active_students,
    total_submissions: subs.length,
    overall_accuracy,
    question_count: qList.length,
    studentLeaderboard,
    groupLeaderboard,
    questionStats,
    cbcScores
  })
})

teacherRouter.get('/sessions/:id/review', async (req, res) => {
  const { data: session } = await supabaseAdmin.from('sessions').select('*').eq('id', req.params.id).single()
  if (!session) return res.status(404).json({ error: 'Session not found' })
  if (req.user.role !== 'admin' && session.teacher_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const [{ data: questions }, { data: groups }, { data: submissions }, { data: chats }] = await Promise.all([
    supabaseAdmin.from('questions').select('*').eq('session_id', session.id).order('order_index', { ascending: true }),
    supabaseAdmin.from('groups').select('*').eq('session_id', session.id),
    supabaseAdmin.from('submissions').select('*, users(name, avatar)').eq('session_id', session.id).order('created_at', { ascending: true }),
    supabaseAdmin.from('chat_messages').select('*').eq('session_id', session.id).order('sent_at', { ascending: true })
  ])

  res.json({
    session,
    questions: questions || [],
    groups: groups || [],
    submissions: (submissions || []).map(s => ({
      ...s,
      student_name: s.users?.name,
      student_avatar: s.users?.avatar
    })),
    chats: chats || []
  })
})

teacherRouter.get('/question-bank', async (req, res) => {
  let q = supabaseAdmin.from('question_bank').select('*, subjects(name)').order('created_at', { ascending: false })
  if (req.user.role !== 'admin') q = q.eq('teacher_id', req.user.id)
  if (req.query.subject_id) q = q.eq('subject_id', req.query.subject_id)
  const { data: questions, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json({
    questions: (questions || []).map(row => ({
      ...row,
      subject: row.subjects?.name || row.subject
    }))
  })
})

teacherRouter.post('/question-bank', async (req, res) => {
  const body = req.body || {}
  if (!body.subject_id) return res.status(400).json({ error: 'subject_id required' })

  if (req.user.role !== 'admin') {
    const allowed = await teacherSubjectIds(req.user.id)
    if (!allowed.includes(body.subject_id)) {
      return res.status(403).json({ error: 'You are not assigned to that subject' })
    }
  }

  const { data: subject } = await supabaseAdmin.from('subjects').select('name').eq('id', body.subject_id).single()
  const { data: question, error } = await supabaseAdmin
    .from('question_bank')
    .insert({
      teacher_id: req.user.id,
      subject_id: body.subject_id,
      subject: subject?.name || body.subject,
      topic: body.topic,
      type: body.type || 'multiple_choice',
      marks: body.marks ?? 10,
      content_json: body.content_json || {},
      correct_answer: String(body.correct_answer ?? '0')
    })
    .select('*, subjects(name)')
    .single()
  if (error) return res.status(500).json({ error: error.message })
  res.json({ question: { ...question, subject: question.subjects?.name || question.subject } })
})
