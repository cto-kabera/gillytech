import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { teacherRouter } from './routes/teacher.js'
import { studentRouter } from './routes/student.js'
import { adminRouter } from './routes/admin.js'
import { setupWebSocket } from './websocket.js'

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173', 'https://gillytech.vercel.app'], credentials: true }))
app.use(express.json())

// The custom /api/auth route has been removed since Supabase handles this now
app.use('/api/teacher', teacherRouter)
app.use('/api/student', studentRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_, res) => res.json({ ok: true }))

const server = createServer(app)
setupWebSocket(server)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => console.log(`🚀 Gillytech backend running on http://localhost:${PORT}`))