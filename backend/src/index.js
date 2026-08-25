import './load-env.js'
import express from 'express'
import cors from 'cors'
import { teacherRouter } from './routes/teacher.js'
import { studentRouter } from './routes/student.js'
import { adminRouter } from './routes/admin.js'

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://gillytech.vercel.app',
  process.env.FRONTEND_ORIGIN
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true)
    else callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))
app.use(express.json())

app.use('/api/teacher', teacherRouter)
app.use('/api/student', studentRouter)
app.use('/api/admin', adminRouter)

app.get('/api/health', (_, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Gillytech API on http://localhost:${PORT}`))
