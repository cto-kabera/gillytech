import { Router } from 'express'
import { auth, requireRole } from '../middleware/auth.js'

export const adminRouter = Router()
adminRouter.use(auth, requireRole('admin'))

adminRouter.get('/overview', async (req, res) => {
  // Use parallel queries for performance
  const [
    { count: schools }, { count: teachers }, { count: students },
    { count: classes }, { count: sessions },
    { data: active_sessions }, { data: submissions }, { count: badges_awarded },
    { data: recentSessions }, { data: teacherData }
  ] = await Promise.all([
    req.supabase.from('schools').select('*', { count: 'exact', head: true }),
    req.supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
    req.supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    req.supabase.from('classes').select('*', { count: 'exact', head: true }),
    req.supabase.from('sessions').select('*', { count: 'exact', head: true }),
    req.supabase.from('sessions').select('id').eq('status', 'active'),
    req.supabase.from('submissions').select('is_correct, score'),
    req.supabase.from('badges').select('*', { count: 'exact', head: true }),
    req.supabase.from('sessions').select('*, classes(name), users!teacher_id(name)').order('created_at', { ascending: false }).limit(5),
    req.supabase.from('users').select('*, classes(count)').eq('role', 'teacher')
  ])

  const accuracy = submissions?.length 
    ? Math.round(submissions.filter(s => s.is_correct).length / submissions.length * 100) 
    : 0

  res.json({
    stats: {
      schools: schools || 0, teachers: teachers || 0, students: students || 0,
      classes: classes || 0, sessions: sessions || 0, active_sessions: active_sessions?.length || 0,
      total_submissions: submissions?.length || 0, overall_accuracy: accuracy, badges_awarded: badges_awarded || 0
    },
    recentSessions: recentSessions?.map(s => ({
      ...s,
      class_name: s.classes?.name,
      teacher_name: s.users?.name,
      submission_count: 0 // Replace with join query if needed
    })) || [],
    teachers: teacherData?.map(t => ({
      ...t,
      class_count: t.classes[0]?.count || 0,
      session_count: 0 // Replace with join query if needed
    })) || []
  })
})