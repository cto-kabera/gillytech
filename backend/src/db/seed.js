// backend/src/db/seed.js
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { v4 as uuid } from 'uuid'
import { supabase } from './supabase.js' // Your new Supabase client

const h = p => bcrypt.hashSync(p, 10)
const now = () => new Date().toISOString()

async function seed() {
  console.log('Clearing old data...')
  // Optional: clear existing data if you run this multiple times
  // Be careful with foreign key constraints; truncating cascading tables is usually best done in SQL.
  
  const schoolId = uuid()
  const adminId = uuid()
  const t1 = uuid()
  
  console.log('Seeding schools...')
  await supabase.from('schools').insert([
    { id: schoolId, name: 'Nairobi STEM Academy', country: 'Kenya', city: 'Nairobi', created_at: now() }
  ])

  console.log('Seeding users...')
  await supabase.from('users').insert([
    { id: adminId, school_id: schoolId, name: 'Admin User', email: 'admin@gillytech.dev', password_hash: h('admin123'), role: 'admin', avatar: 'AU', created_at: now() },
    { id: t1, school_id: schoolId, name: 'Ms. Achieng Otieno', email: 'teacher@gillytech.dev', password_hash: h('teacher123'), role: 'teacher', avatar: 'AO', subject: 'Biology', created_at: now() }
    // Add the rest of your students here
  ])

  // Continue for classes, sessions, questions, etc., replacing db.data.push with supabase.from().insert()

  console.log('✅ Gillytech Supabase seeded!')
}

seed().catch(console.error)