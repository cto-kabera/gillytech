import { Router } from 'express'
import { auth } from '../middleware/auth.js'

export const studentRouter = Router()
studentRouter.use(auth)

studentRouter.get('/join/:code', async (req, res) => {
  // Find class by code
  const { data: cls, error: clsErr } = await req.supabase.from('classes').select('*').eq('join_code', req.params.code.toUpperCase()).single()
  if (clsErr || !cls) return res.status(404).json({ error: 'Class not found' })

  // Find active session
  const { data: session } = await req.supabase.from('sessions').select('*').eq('class_id', cls.id).eq('status', 'active').single()
  if (!session) return res.status(404).json({ error: 'No active session for this class' })

  // Fetch questions (stripping correct_answer)
  const { data: questions } = await req.supabase.from('questions').select('id, session_id, order_index, type, marks, time_limit_sec, content_json').eq('session_id', session.id).order('order_index', { ascending: true })

  // Fetch group and mates
  const { data: myMembership } = await req.supabase.from('group_members').select('group_id').eq('student_id', req.user.id).single()
  
  let group = null, groupMates = []
  if (myMembership) {
    const { data: g } = await req.supabase.from('groups').select('*').eq('id', myMembership.group_id).single()
    group = g
    
    const { data: mates } = await req.supabase
      .from('group_members')
      .select('users(id, name, avatar)')
      .eq('group_id', group.id)
      .neq('student_id', req.user.id)
      
    groupMates = mates?.map(m => m.users) || []
  }

  res.json({ session, questions, group, groupMates, class: cls })
})

studentRouter.post('/session/:id/submit', async (req, res) => {
  const { question_id, reasoning_text, answer } = req.body || {}
  if (!question_id || answer === undefined) return res.status(400).json({ error: 'question_id and answer required' })

  // Check if already submitted
  const { data: existing } = await req.supabase.from('submissions').select('id').eq('question_id', question_id).eq('student_id', req.user.id).single()
  if (existing) return res.status(409).json({ error: 'Already submitted' })

  // Fetch question for scoring
  const { data: question } = await req.supabase.from('questions').select('*').eq('id', question_id).single()
  if (!question) return res.status(404).json({ error: 'Question not found' })

  // Fetch group ID
  const { data: gm } = await req.supabase.from('group_members').select('group_id').eq('student_id', req.user.id).single()

  // Calculate score logic
  const is_correct = String(answer) === String(question.correct_answer)
  const { data: prevCorrect } = await req.supabase.from('submissions').select('id').eq('question_id', question_id).eq('is_correct', true).limit(1)
  const is_first_correct = is_correct && !prevCorrect?.length
  
  let score = 0
  if (is_correct) score += 8
  if (is_first_correct) score += 2
  if ((reasoning_text||'').trim().length > 20) score += 2

  // Insert submission
  const { data: sub, error } = await req.supabase
    .from('submissions')
    .insert({
      question_id, 
      student_id: req.user.id,
      group_id: gm?.group_id || null,
      reasoning_text: reasoning_text || '', 
      answer: String(answer),
      is_correct, 
      is_first_correct, 
      score
    })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Issue badge if first correct
  if (is_first_correct) {
    await req.supabase.from('badges').insert({ student_id: req.user.id, session_id: req.params.id, badge_type: 'first_correct' })
  }

  res.json({ submission: sub, correct_answer: question.correct_answer, is_correct, is_first_correct, score, options: question.content_json?.options })
})

studentRouter.get('/profile', async (req, res) => {
  const { data: user, error } = await req.supabase.from('users').select('*').eq('id', req.user.id).single()
  if (error || !user) return res.status(404).json({ error: 'Not found' })
  
  const { data: subs } = await req.supabase.from('submissions').select('score, is_correct').eq('student_id', req.user.id)
  const { data: badges } = await req.supabase.from('badges').select('*').eq('student_id', req.user.id)

  const totalScore = subs?.reduce((a,s) => a+s.score, 0) || 0
  const correctCount = subs?.filter(s => s.is_correct).length || 0
  const accuracy = subs?.length ? Math.round((correctCount / subs.length) * 100) : 0

  res.json({ 
    user, 
    stats: { total_submissions: subs?.length || 0, total_score: totalScore, accuracy, badges_count: badges?.length || 0 }, 
    badges: badges || [] 
  })
})