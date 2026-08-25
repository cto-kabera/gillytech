import '../load-env.js'
import { supabaseAdmin } from './supabase.js'

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
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
