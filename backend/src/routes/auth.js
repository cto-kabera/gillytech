import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db/database.js'
import { sign, SECRET } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  await db.read()
  const user = db.data.users.find(u => u.email === email)
  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const { password_hash, ...safe } = user
  res.json({ token: sign({ id: user.id, role: user.role, name: user.name }), user: safe })
})

authRouter.get('/me', async (req, res) => {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  try {
    const p = jwt.verify(h.slice(7), SECRET)
    await db.read()
    const user = db.data.users.find(u => u.id === p.id)
    if (!user) return res.status(404).json({ error: 'Not found' })
    const { password_hash, ...safe } = user
    res.json({ user: safe })
  } catch { res.status(401).json({ error: 'Invalid token' }) }
})
