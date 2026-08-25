import '../load-env.js'
import { supabaseAdmin } from './supabase.js'

const demoUsers = [
  { email: 'admin@gillytech.dev', password: 'admin123', meta: { name: 'Admin User', role: 'admin' } },
  { email: 'teacher@gillytech.dev', password: 'teacher123', meta: { name: 'Ms. Achieng Otieno', role: 'teacher', subject: 'Biology' } },
  { email: 'amara@gillytech.dev', password: 'student123', meta: { name: 'Amara Osei', role: 'student' } },
  { email: 'brian@gillytech.dev', password: 'student123', meta: { name: 'Brian Mwangi', role: 'student' } },
  { email: 'cynthia@gillytech.dev', password: 'student123', meta: { name: 'Cynthia Wanjiku', role: 'student' } },
  { email: 'david@gillytech.dev', password: 'student123', meta: { name: 'David Otieno', role: 'student' } },
  { email: 'esther@gillytech.dev', password: 'student123', meta: { name: 'Esther Akinyi', role: 'student' } },
  { email: 'felix@gillytech.dev', password: 'student123', meta: { name: 'Felix Kamau', role: 'student' } },
]

async function seedAuth() {
  console.log('Seeding Supabase Auth (creates public.users via trigger)...')

  for (const u of demoUsers) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.meta
    })
    if (error) {
      if (String(error.message).toLowerCase().includes('already')) {
        console.log(`• exists: ${u.email}`)
      } else {
        console.error(`Error creating ${u.email}:`, error.message)
      }
    } else {
      console.log(`Created ${u.email}`)
    }
  }

  console.log('Auth seed done.')
}

seedAuth().catch((err) => {
  console.error(err)
  process.exit(1)
})
