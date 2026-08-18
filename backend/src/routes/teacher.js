import { Router } from 'express'
import { auth, requireRole } from '../middleware/auth.js'
import { broadcastToSession } from '../websocket.js' // Keep if still using custom WS, or remove if using Supabase Realtime

export const teacherRouter = Router()
teacherRouter.use(auth, requireRole('teacher', 'admin'))

// --- Classes ---
teacherRouter.get('/classes', async (req, res) => {
  const { data: classes, error } = await req.supabase
    .from('classes')
    .select('*, enrollments(count), sessions(count)')
  
  if (error) return res.status(500).json({ error: error.message })
  
  // Format counts to match frontend expectations
  const enriched = classes.map(c => ({
    ...c,
    enrolled: c.enrollments[0]?.count || 0,
    sessions: c.sessions[0]?.count || 0
  }))
  res.json({ classes: enriched })
})

teacherRouter.post('/classes', async (req, res) => {
  const { name, grade_level, subject } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })

  // Fetch teacher's school_id
  const { data: user } = await req.supabase.from('users').select('school_id').eq('id', req.user.id).single()

  const join_code = `${(subject||'STEM').slice(0,3).toUpperCase()}-${Math.floor(1000+Math.random()*9000)}`

  const { data: cls, error } = await req.supabase
    .from('classes')
    .insert({ teacher_id: req.user.id, school_id: user.school_id, name, grade_level, subject, join_code })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ class: cls })
})

// --- Sessions ---
teacherRouter.get('/sessions', async (req, res) => {
  const { data: sessions, error } = await req.supabase
    .from('sessions')
    .select('*, classes(name), questions(count)')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const enriched = sessions.map(s => ({
    ...s,
    class_name: s.classes?.name,
    question_count: s.questions[0]?.count || 0,
    submission_count: 0 // You can calculate this via a separate view or count query
  }))
  res.json({ sessions: enriched })
})

teacherRouter.post('/sessions', async (req, res) => {
  const { class_id, title, questions } = req.body
  if (!class_id || !title) return res.status(400).json({ error: 'class_id and title required' })

  // 1. Create Session
  const { data: session, error: sessErr } = await req.supabase
    .from('sessions')
    .insert({ class_id, teacher_id: req.user.id, title, status: 'draft' })
    .select()
    .single()
  
  if (sessErr) return res.status(500).json({ error: sessErr.message })

  // 2. Insert Questions
  if (questions?.length) {
    const qs = questions.map((q, i) => ({ session_id: session.id, order_index: i, ...q }))
    await req.supabase.from('questions').insert(qs)
  }

  // 3. Auto-create groups from enrolled students
  const { data: enrolled } = await req.supabase.from('enrollments').select('student_id').eq('class_id', class_id)
  if (enrolled?.length) {
    const groupColors = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
    const groupSize = 4
    
    for (let i = 0; i < Math.ceil(enrolled.length / groupSize); i++) {
      const { data: group } = await req.supabase
        .from('groups')
        .insert({ session_id: session.id, name: `Group ${String.fromCharCode(65+i)}`, formed_by: 'auto', color: groupColors[i % groupColors.length] })
        .select()
        .single()
      
      const groupStudents = enrolled.slice(i * groupSize, (i + 1) * groupSize)
      const members = groupStudents.map(e => ({ group_id: group.id, student_id: e.student_id }))
      await req.supabase.from('group_members').insert(members)
    }
  }

  res.json({ session })
})

teacherRouter.patch('/sessions/:id', async (req, res) => {
  const { status, current_question_index } = req.body
  let updateData = {}

  if (status) {
    updateData.status = status
    if (status === 'active') updateData.started_at = new Date().toISOString()
    if (status === 'completed') updateData.ended_at = new Date().toISOString()
  }
  
  if (current_question_index !== undefined) {
    updateData.current_question_index = current_question_index
  }

  const { data: session, error } = await req.supabase
    .from('sessions')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json({ session })
})

// --- Question Bank ---
teacherRouter.get('/question-bank', async (req, res) => {
  const { data: questions, error } = await req.supabase.from('question_bank').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json({ questions })
})

teacherRouter.post('/question-bank', async (req, res) => {
  const { data: question, error } = await req.supabase
    .from('question_bank')
    .insert({ teacher_id: req.user.id, ...req.body })
    .select()
    .single()
    
  if (error) return res.status(500).json({ error: error.message })
  res.json({ question })
})