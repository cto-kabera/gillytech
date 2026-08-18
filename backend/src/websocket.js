import { WebSocketServer } from 'ws'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

// Create a global client for backend operations
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const sessionClients = new Map()
const clientMeta = new Map()

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' })
  
  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')
    const sessionId = url.searchParams.get('sessionId')
    
    if (!sessionId || !token) { ws.close(); return }

    // 1. Authenticate with Supabase Auth
    const scopedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    const { data: { user }, error: authErr } = await scopedClient.auth.getUser()
    if (authErr || !user) { ws.close(); return }

    if (!sessionClients.has(sessionId)) sessionClients.set(sessionId, new Set())
    sessionClients.get(sessionId).add(ws)

    // 2. Fetch User and Group info from Supabase
    const { data: profile } = await supabase.from('users').select('role, name').eq('id', user.id).single()
    const { data: groupMember } = await supabase.from('group_members').select('group_id').eq('student_id', user.id).single()
    
    const groupId = groupMember?.group_id || null

    clientMeta.set(ws, { userId: user.id, name: profile?.name, role: profile?.role, sessionId, groupId })
    
    // Broadcast Presence
    broadcastGroup(sessionId, groupId, { type: 'presence', event: 'joined', userId: user.id, name: profile?.name }, ws)
    ws.send(JSON.stringify({ type: 'connected', userId: user.id, groupId }))

    // 3. Handle incoming messages
    ws.on('message', async raw => {
      let msg; try { msg = JSON.parse(raw) } catch { return }
      const meta = clientMeta.get(ws)
      if (!meta) return

      if (msg.type === 'chat' && msg.text?.trim() && msg.questionId) {
        // Save chat message to Supabase PostgreSQL
        const { data: insertedMsg, error: chatErr } = await supabase
          .from('chat_messages')
          .insert({
            group_id: meta.groupId,
            question_id: msg.questionId,
            sender_id: meta.userId,
            message: msg.text.trim().slice(0, 500)
          })
          .select()
          .single()

        if (!chatErr) {
           broadcastGroup(meta.sessionId, meta.groupId, { 
             type: 'chat', 
             message: { ...insertedMsg, sender_name: meta.name } 
           })
        }
      }
      
      if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
    })

    ws.on('close', () => {
      const meta = clientMeta.get(ws)
      if (meta) {
        sessionClients.get(meta.sessionId)?.delete(ws)
        broadcastGroup(meta.sessionId, meta.groupId, { type: 'presence', event: 'left', userId: meta.userId, name: meta.name }, ws)
        clientMeta.delete(ws)
      }
    })
  })
}

function broadcastGroup(sessionId, groupId, payload, exclude = null) {
  const clients = sessionClients.get(sessionId)
  if (!clients) return
  const data = JSON.stringify(payload)
  
  for (const client of clients) {
    if (client === exclude || client.readyState !== 1) continue
    const meta = clientMeta.get(client)
    if (!meta) continue
    if (groupId && meta.groupId !== groupId && meta.role !== 'teacher') continue
    client.send(data)
  }
}

export function broadcastToSession(sessionId, payload) {
  const clients = sessionClients.get(sessionId)
  if (!clients) return
  const data = JSON.stringify(payload)
  
  for (const client of clients) {
    if (client.readyState === 1) client.send(data)
  }
}