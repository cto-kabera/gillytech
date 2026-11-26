import '../load-env.js'
import { supabaseAdmin } from './supabase.js'
import { buildSubmissionHci } from '../lib/hci.js'

async function userByEmail(email) {
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).maybeSingle()
  if (error) throw error
  return data
}

async function seed() {
  const teacher = await userByEmail('teacher@gillytech.dev')
  const admin = await userByEmail('admin@gillytech.dev')
  if (!teacher || !admin) {
    throw new Error('Auth users missing. Run `npm run seed:auth` in backend first, then apply the SQL migration so public.users is populated.')
  }

  const studentEmails = [
    'amara@gillytech.dev',
    'brian@gillytech.dev',
    'cynthia@gillytech.dev',
    'david@gillytech.dev',
    'esther@gillytech.dev',
    'felix@gillytech.dev'
  ]
  const students = []
  for (const email of studentEmails) {
    const u = await userByEmail(email)
    if (u) students.push(u)
  }
  if (!students.length) throw new Error('No student profiles found in public.users')

  console.log('Seeding school, class, enrollments...')

  const { data: existingSchool } = await supabaseAdmin.from('schools').select('*').eq('name', 'Nairobi STEM Academy').maybeSingle()
  let school = existingSchool
  if (!school) {
    const { data, error } = await supabaseAdmin
      .from('schools')
      .insert({ name: 'Nairobi STEM Academy', country: 'Kenya', city: 'Nairobi' })
      .select()
      .single()
    if (error) throw error
    school = data
  }

  await supabaseAdmin.from('users').update({ school_id: school.id }).in('id', [admin.id, teacher.id, ...students.map(s => s.id)])

  const { data: existingClass } = await supabaseAdmin.from('classes').select('*').eq('join_code', 'BIO-2024').maybeSingle()
  let cls = existingClass

  let { data: bio } = await supabaseAdmin.from('subjects').select('*').eq('name', 'Biology').maybeSingle()
  if (!bio) {
    const { data, error } = await supabaseAdmin.from('subjects').insert({ school_id: school.id, name: 'Biology' }).select().single()
    if (error) throw error
    bio = data
  }
  await supabaseAdmin.from('teacher_subjects').upsert({ teacher_id: teacher.id, subject_id: bio.id }, { onConflict: 'teacher_id,subject_id' })

  if (!cls) {
    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert({
        teacher_id: teacher.id,
        school_id: school.id,
        name: 'Form 3 Biology',
        grade_level: 'Grade 10',
        subject: 'Biology',
        subject_id: bio.id,
        join_code: 'BIO-2024'
      })
      .select()
      .single()
    if (error) throw error
    cls = data
  } else if (!cls.subject_id) {
    await supabaseAdmin.from('classes').update({ subject_id: bio.id, subject: 'Biology' }).eq('id', cls.id)
  }

  const enrollments = students.map(s => ({ class_id: cls.id, student_id: s.id }))
  await supabaseAdmin.from('enrollments').upsert(enrollments, { onConflict: 'class_id,student_id' })

  const { data: bankExisting } = await supabaseAdmin.from('question_bank').select('id').eq('teacher_id', teacher.id).limit(1)
  if (!bankExisting?.length) {
    await supabaseAdmin.from('question_bank').insert({
      teacher_id: teacher.id,
      subject: 'Biology',
      subject_id: bio.id,
      topic: 'Photosynthesis',
      type: 'multiple_choice',
      marks: 10,
      content_json: {
        text: 'Which organelle is the primary site of photosynthesis in plant cells?',
        options: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Ribosome']
      },
      correct_answer: '1'
    })
  }

  console.log('Classroom seed done. Join code: BIO-2024')
  await seedHistory(teacher, students)
}

function timingBlock({ shownAt, submittedAt, planning, active, edits, rapid, backgrounded, writing }) {
  const total = new Date(submittedAt).getTime() - new Date(shownAt).getTime()
  return {
    questionShownAt: shownAt,
    submittedAt,
    totalTimeMs: total,
    planningLatencyMs: planning,
    activeReasoningMs: active,
    editCount: edits,
    answerSelectedOffsetMs: planning + active + 800,
    lastEditOffsetMs: planning + active,
    writingProcess: {
      keystrokeCount: writing.keystrokes,
      charsTyped: writing.typed,
      charsDeleted: writing.deleted,
      pauseCount: writing.pauses,
      longestPauseMs: writing.longestPause,
      burstCount: writing.bursts,
      revisionRatio: writing.deleted / Math.max(1, writing.typed)
    },
    flags: {
      backgrounded,
      clientClockSkewMs: 120,
      suspectRapid: rapid,
      clientMarksDropped: false
    }
  }
}

async function seedHistory(teacher, students) {
  const byEmail = Object.fromEntries(students.map(s => [s.email, s]))
  const amara = byEmail['amara@gillytech.dev']
  const brian = byEmail['brian@gillytech.dev']
  const cynthia = byEmail['cynthia@gillytech.dev']
  const david = byEmail['david@gillytech.dev']
  const esther = byEmail['esther@gillytech.dev']
  const felix = byEmail['felix@gillytech.dev']
  if (!amara || !brian) {
    console.log('Skipping history seed — need at least amara and brian')
    return
  }

  const { data: cls } = await supabaseAdmin.from('classes').select('*').eq('join_code', 'BIO-2024').maybeSingle()
  if (!cls) return

  const title = 'Photosynthesis — Wk3'
  let { data: session } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('class_id', cls.id)
    .eq('title', title)
    .maybeSingle()

  const shownQ1 = new Date(Date.now() - 45 * 60 * 1000).toISOString()
  const shownQ2 = new Date(Date.now() - 25 * 60 * 1000).toISOString()

  if (!session) {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        class_id: cls.id,
        teacher_id: teacher.id,
        title,
        status: 'completed',
        current_question_index: 1,
        started_at: shownQ1,
        ended_at: new Date().toISOString(),
        current_question_shown_at: shownQ2
      })
      .select()
      .single()
    if (error) throw error
    session = data
  }

  let { data: questions } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('session_id', session.id)
    .order('order_index', { ascending: true })

  if (!questions?.length) {
    const q1 = {
      text: 'Which gas do plants take in during photosynthesis?',
      options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen']
    }
    const q2 = {
      text: 'Which organelle is the primary site of photosynthesis in plant cells?',
      options: ['Mitochondrion', 'Chloroplast', 'Nucleus', 'Ribosome']
    }
    const { data: inserted, error } = await supabaseAdmin
      .from('questions')
      .insert([
        { session_id: session.id, order_index: 0, type: 'multiple_choice', marks: 10, time_limit_sec: 120, content_json: q1, correct_answer: '1' },
        { session_id: session.id, order_index: 1, type: 'multiple_choice', marks: 10, time_limit_sec: 120, content_json: q2, correct_answer: '1' }
      ])
      .select()
    if (error) throw error
    questions = inserted
  }

  const q1 = questions.find(q => q.order_index === 0) || questions[0]
  const q2 = questions.find(q => q.order_index === 1) || questions[1]
  if (!q1 || !q2) return

  const rows = [
    {
      student: amara,
      question: q1,
      answer: '0',
      correct: false,
      first: false,
      score: 2,
      reasoning: 'Plants breathe out oxygen so they must take in the other one, CO2.',
      shownAt: shownQ1,
      submittedAt: new Date(new Date(shownQ1).getTime() + 42000).toISOString(),
      planning: 8000,
      active: 22000,
      edits: 2,
      rapid: false,
      backgrounded: false,
      writing: { keystrokes: 72, typed: 63, deleted: 8, pauses: 2, longestPause: 3500, bursts: 3 },
      hciClient: { unlockAttemptsBeforeValid: 2, placeholderAttempts: 1, messagesSent: 6, groupSharePct: 0.22, turnTakingIndex: 0.68, optionChanges: 1, perceivedSyncDelayMs: 140, seq: 5 }
    },
    {
      student: brian,
      question: q1,
      answer: '1',
      correct: true,
      first: true,
      score: 12,
      reasoning: 'Photosynthesis uses carbon dioxide from the air and water to make glucose, releasing oxygen.',
      shownAt: shownQ1,
      submittedAt: new Date(new Date(shownQ1).getTime() + 28000).toISOString(),
      planning: 3500,
      active: 18000,
      edits: 1,
      rapid: false,
      backgrounded: false,
      writing: { keystrokes: 95, typed: 90, deleted: 4, pauses: 1, longestPause: 2100, bursts: 2 },
      hciClient: { unlockAttemptsBeforeValid: 0, messagesSent: 4, groupSharePct: 0.35, turnTakingIndex: 0.82, optionChanges: 0, perceivedSyncDelayMs: 120, seq: 7, reasoningMatchesAnswer: true }
    },
    {
      student: cynthia,
      question: q1,
      answer: '1',
      correct: true,
      first: false,
      score: 10,
      reasoning: 'The word equation is carbon dioxide plus water to glucose and oxygen, so they take in CO2.',
      shownAt: shownQ1,
      submittedAt: new Date(new Date(shownQ1).getTime() + 51000).toISOString(),
      planning: 12000,
      active: 30000,
      edits: 3,
      rapid: false,
      backgrounded: false,
      writing: { keystrokes: 110, typed: 88, deleted: 15, pauses: 3, longestPause: 5000, bursts: 4 },
      hciClient: { unlockAttemptsBeforeValid: 1, messagesSent: 5, groupSharePct: 0.28, turnTakingIndex: 0.75, optionChanges: 0, perceivedSyncDelayMs: 160, seq: 6 }
    },
    {
      student: david,
      question: q1,
      answer: '0',
      correct: false,
      first: false,
      score: 2,
      reasoning: 'I think they take in oxygen because living things need oxygen to survive always.',
      shownAt: shownQ1,
      submittedAt: new Date(new Date(shownQ1).getTime() + 3200).toISOString(),
      planning: 400,
      active: 1800,
      edits: 0,
      rapid: true,
      backgrounded: false,
      writing: { keystrokes: 28, typed: 80, deleted: 0, pauses: 0, longestPause: 0, bursts: 1 },
      hciClient: { unlockAttemptsBeforeValid: 4, placeholderAttempts: 3, messagesSent: 1, groupSharePct: 0.08, turnTakingIndex: 0.4, optionChanges: 0, perceivedSyncDelayMs: 420, seq: 3 }
    },
    {
      student: esther,
      question: q2,
      answer: '1',
      correct: true,
      first: true,
      score: 12,
      reasoning: 'Chloroplasts contain chlorophyll which captures light energy for photosynthesis in plant cells.',
      shownAt: shownQ2,
      submittedAt: new Date(new Date(shownQ2).getTime() + 36000).toISOString(),
      planning: 6000,
      active: 20000,
      edits: 1,
      rapid: false,
      backgrounded: true,
      writing: { keystrokes: 88, typed: 84, deleted: 3, pauses: 2, longestPause: 4000, bursts: 3 },
      hciClient: { unlockAttemptsBeforeValid: 0, messagesSent: 7, groupSharePct: 0.31, turnTakingIndex: 0.71, optionChanges: 1, perceivedSyncDelayMs: 200, seq: 6 }
    },
    {
      student: felix,
      question: q2,
      answer: '0',
      correct: false,
      first: false,
      score: 2,
      reasoning: 'Mitochondria make energy so they might also be where food is made in the plant cell.',
      shownAt: shownQ2,
      submittedAt: new Date(new Date(shownQ2).getTime() + 24000).toISOString(),
      planning: 9000,
      active: 11000,
      edits: 1,
      rapid: false,
      backgrounded: false,
      writing: { keystrokes: 70, typed: 85, deleted: 6, pauses: 1, longestPause: 2500, bursts: 2 },
      hciClient: { unlockAttemptsBeforeValid: 1, messagesSent: 3, groupSharePct: 0.18, turnTakingIndex: 0.55, optionChanges: 0, perceivedSyncDelayMs: 180, seq: 5 }
    }
  ].filter(r => r.student)

  for (const r of rows) {
    const { data: existing } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('question_id', r.question.id)
      .eq('student_id', r.student.id)
      .maybeSingle()
    const timing = timingBlock({
      shownAt: r.shownAt,
      submittedAt: r.submittedAt,
      planning: r.planning,
      active: r.active,
      edits: r.edits,
      rapid: r.rapid,
      backgrounded: r.backgrounded,
      writing: r.writing
    })
    const hci = buildSubmissionHci({
      timing,
      clientHci: r.hciClient,
      reasoningText: r.reasoning,
      isCorrect: r.correct,
      reasoningMatchesAnswer: r.hciClient?.reasoningMatchesAnswer ?? (r.correct ? true : r.student.email === 'amara@gillytech.dev' ? false : null)
    })

    if (existing) {
      await supabaseAdmin.from('submissions').update({ timing, hci }).eq('id', existing.id)
      continue
    }

    const { error } = await supabaseAdmin.from('submissions').insert({
      session_id: session.id,
      question_id: r.question.id,
      student_id: r.student.id,
      reasoning_text: r.reasoning,
      answer: r.answer,
      is_correct: r.correct,
      is_first_correct: r.first,
      score: r.score,
      question_text: r.question.content_json?.text,
      options_json: r.question.content_json?.options,
      correct_answer_snapshot: r.question.correct_answer,
      timing,
      hci
    })
    if (error) throw error

    if (r.first) {
      await supabaseAdmin.from('badges').insert({
        student_id: r.student.id,
        session_id: session.id,
        badge_type: 'first_correct'
      })
    }
  }

  for (const r of rows) {
    if (!r.hciClient?.seq) continue
    const { data: ex } = await supabaseAdmin
      .from('hci_surveys')
      .select('id')
      .eq('session_id', session.id)
      .eq('student_id', r.student.id)
      .eq('question_id', r.question.id)
      .maybeSingle()
    if (ex) continue
    await supabaseAdmin.from('hci_surveys').insert({
      session_id: session.id,
      question_id: r.question.id,
      student_id: r.student.id,
      seq_score: r.hciClient.seq,
      stage: 'post_round'
    })
  }

  console.log('History + HCI seed done. Session: Photosynthesis — Wk3 (Admin/Teacher → Computer Interaction)')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
