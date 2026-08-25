import { Router } from 'express'
import { auth, requireRole } from '../middleware/auth.js'
import { supabaseAdmin } from '../db/supabase.js'
import { studentGroupForSession, groupMates, clientQuestion, assignToSmallestGroup } from '../lib/access.js'

export const studentRouter = Router()
studentRouter.use(auth, requireRole('student', 'admin'))

async function loadJoinPayload(session, studentId) {
  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('id, session_id, order_index, type, marks, time_limit_sec, content_json')
    .eq('session_id', session.id)
    .order('order_index', { ascending: true })

  let { group } = await studentGroupForSession(studentId, session.id)
  if (!group) group = await assignToSmallestGroup(session.id, studentId)

  const mates = await groupMates(group?.id, studentId)
  const { data: cls } = await supabaseAdmin.from('classes').select('*').eq('id', session.class_id).single()

  return { session, questions: questions || [], group, groupMates: mates, class: cls }
}

studentRouter.get('/join/:code', async (req, res) => {
  const { data: cls, error: clsErr } = await supabaseAdmin
    .from('classes')
    .select('*')
    .eq('join_code', req.params.code.toUpperCase())
    .maybeSingle()
  if (clsErr || !cls) return res.status(404).json({ error: 'Class not found' })

  const { data: session } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('class_id', cls.id)
    .eq('status', 'active')
    .maybeSingle()
  if (!session) return res.status(404).json({ error: 'No active session for this class' })

  await supabaseAdmin
    .from('enrollments')
    .upsert({ class_id: cls.id, student_id: req.user.id }, { onConflict: 'class_id,student_id' })

  const payload = await loadJoinPayload(session, req.user.id)
  res.json(payload)
})

studentRouter.get('/session/:id/state', async (req, res) => {
  const { data: session } = await supabaseAdmin.from('sessions').select('*').eq('id', req.params.id).single()
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const { data: questions } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('session_id', session.id)
    .order('order_index', { ascending: true })

  const index = session.current_question_index || 0
  const raw = questions?.[index] || null
  let { group } = await studentGroupForSession(req.user.id, session.id)
  const mates = await groupMates(group?.id, req.user.id)

  let submission = null
  if (raw) {
    const { data } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('question_id', raw.id)
      .eq('student_id', req.user.id)
      .maybeSingle()
    submission = data
  }

  const question = submission
    ? raw
    : clientQuestion(raw)

  res.json({
    session,
    group,
    groupMates: mates,
    question,
    index,
    total: questions?.length || 0,
    submitted: Boolean(submission),
    submission
  })
})

studentRouter.post('/session/:id/submit', async (req, res) => {
  const { question_id, reasoning_text, answer } = req.body || {}
  if (!question_id || answer === undefined) {
    return res.status(400).json({ error: 'question_id and answer required' })
  }

  const { group } = await studentGroupForSession(req.user.id, req.params.id)

  const { data, error } = await supabaseAdmin.rpc('submit_reasoned_answer', {
    p_session_id: req.params.id,
    p_question_id: question_id,
    p_student_id: req.user.id,
    p_group_id: group?.id || null,
    p_reasoning: reasoning_text || '',
    p_answer: String(answer)
  })

  // #region agent log
  fetch('http://127.0.0.1:7852/ingest/afc955dc-9d20-480c-ae49-585cc1d8bbca',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4d36a5'},body:JSON.stringify({sessionId:'4d36a5',runId:'pre-fix',hypothesisId:'A',location:'student.js:submit',message:'submit_reasoned_answer result',data:{ok:!error,code:error?.code||null,msg:error?.message||null,hasData:Boolean(data),isFirst:data?.is_first_correct??null},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (error) {
    const msg = error.message || 'Submit failed'
    if (msg.includes('Already submitted')) return res.status(409).json({ error: msg })
    if (msg.includes('Reasoning too short')) return res.status(400).json({ error: msg })
    if (msg.includes('not active')) return res.status(400).json({ error: msg })
    return res.status(500).json({ error: msg })
  }

  res.json(data)
})

studentRouter.get('/session/:id/leaderboard', async (req, res) => {
  const sessionId = req.params.id
  const { data: groups } = await supabaseAdmin.from('groups').select('*').eq('session_id', sessionId)
  const { data: session } = await supabaseAdmin.from('sessions').select('class_id').eq('id', sessionId).single()
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('student_id, users(id, name, avatar)')
    .eq('class_id', session.class_id)

  const { data: subs } = await supabaseAdmin.from('submissions').select('student_id, group_id, score').eq('session_id', sessionId)

  const totals = {}
  const groupTotals = {}
  for (const s of subs || []) {
    totals[s.student_id] = (totals[s.student_id] || 0) + (s.score || 0)
    if (s.group_id) groupTotals[s.group_id] = (groupTotals[s.group_id] || 0) + (s.score || 0)
  }

  const individual = (enrollments || [])
    .map(e => ({ ...e.users, total: totals[e.student_id] || 0 }))
    .filter(u => u.id)
    .sort((a, b) => b.total - a.total)

  const groupBoard = (groups || [])
    .map(g => ({ ...g, total: groupTotals[g.id] || 0 }))
    .sort((a, b) => b.total - a.total)

  res.json({ individual, groups: groupBoard })
})

studentRouter.get('/session/:id/chat/:qid', async (req, res) => {
  const { group } = await studentGroupForSession(req.user.id, req.params.id)
  if (!group && req.user.role !== 'admin') return res.json({ messages: [] })

  let q = supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('session_id', req.params.id)
    .eq('question_id', req.params.qid)
    .order('sent_at', { ascending: true })

  if (group) q = q.eq('group_id', group.id)

  const { data: messages, error } = await q
  if (error) return res.status(500).json({ error: error.message })
  res.json({ messages: messages || [] })
})

studentRouter.post('/session/:id/chat', async (req, res) => {
  const { text, question_id } = req.body || {}
  if (!text?.trim() || !question_id) return res.status(400).json({ error: 'text and question_id required' })

  const { group } = await studentGroupForSession(req.user.id, req.params.id)
  if (!group) return res.status(403).json({ error: 'Not in a group for this session' })

  const { data: message, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      session_id: req.params.id,
      group_id: group.id,
      question_id,
      sender_id: req.user.id,
      sender_name: req.user.name,
      message: text.trim().slice(0, 500)
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message })
})

studentRouter.get('/profile', async (req, res) => {
  const { data: user, error } = await supabaseAdmin.from('users').select('*').eq('id', req.user.id).single()
  if (error || !user) return res.status(404).json({ error: 'Not found' })

  const { data: subs } = await supabaseAdmin.from('submissions').select('score, is_correct').eq('student_id', req.user.id)
  const { data: badges } = await supabaseAdmin.from('badges').select('*').eq('student_id', req.user.id)

  const totalScore = subs?.reduce((a, s) => a + s.score, 0) || 0
  const correctCount = subs?.filter(s => s.is_correct).length || 0
  const accuracy = subs?.length ? Math.round((correctCount / subs.length) * 100) : 0

  res.json({
    user,
    stats: {
      total_submissions: subs?.length || 0,
      total_score: totalScore,
      accuracy,
      badges_count: badges?.length || 0
    },
    badges: badges || []
  })
})
