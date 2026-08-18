import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

// We use the ANON key here, acting just like a normal frontend user
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: WebSocket
    }
  }
)

async function seedAuth() {
  console.log('Signing up demo users...')

  const demoUsers = [
    { email: 'admin@gillytech.dev', password: 'admin123', meta: { name: 'Admin User', role: 'admin' } },
    { email: 'teacher@gillytech.dev', password: 'teacher123', meta: { name: 'Ms. Achieng Otieno', role: 'teacher' } },
    { email: 'amara@gillytech.dev', password: 'student123', meta: { name: 'Amara Osei', role: 'student' } }
  ]

  for (const u of demoUsers) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: u.meta // This maps to raw_user_meta_data and triggers your public.users insert
      }
    })

    if (error) {
      console.error(`❌ Error signing up ${u.email}:`, error.message)
    } else {
      console.log(`✅ Signed up user: ${u.email}`)
    }
  }
  
  console.log('Done! You can now log in.')
}

seedAuth()