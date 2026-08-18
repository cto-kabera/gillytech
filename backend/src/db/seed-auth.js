import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
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
  console.log('Seeding Supabase Auth...')

  const demoUsers = [
    { email: 'admin@gillytech.dev', password: 'admin123', meta: { name: 'Admin User', role: 'admin' } },
    { email: 'teacher@gillytech.dev', password: 'teacher123', meta: { name: 'Ms. Achieng Otieno', role: 'teacher' } },
    { email: 'amara@gillytech.dev', password: 'student123', meta: { name: 'Amara Osei', role: 'student' } }
  ]

  for (const u of demoUsers) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.meta 
    })

    if (error) {
      console.error(`❌ Error creating ${u.email}:`, error.message)
    } else {
      console.log(`✅ Created user: ${u.email}`)
    }
  }
  
  console.log('Done! Check the Authentication tab in Supabase Studio.')
}

seedAuth()