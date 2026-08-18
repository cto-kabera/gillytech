import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const DEMOS = [
  { label: 'Admin', email: 'admin@gillytech.dev', password: 'admin123', color: '#7c3aed' },
  { label: 'Teacher', email: 'teacher@gillytech.dev', password: 'teacher123', color: '#2563eb' },
  { label: 'Student', email: 'amara@gillytech.dev', password: 'student123', color: '#059669' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      navigate(user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/student')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--gray-50)' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'var(--brand)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', color: '#fff', minWidth: 0 }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚗</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>Gillytech</div>
              <div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>STEM Reasoning Platform</div>
            </div>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Where reasoning matters more than the answer.
          </h1>
          <p style={{ fontSize: 15, opacity: .8, lineHeight: 1.7, marginBottom: 40 }}>
            A collaborative learning environment for Kenyan CBC classrooms. Students explain their thinking, discuss in teams, and compete constructively — all in real time.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['⚡ Reasoning before answering', '👥 Real-time group collaboration', '📊 CBC competency tracking', '🏆 Live leaderboards'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, opacity: .9 }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', background: 'var(--white)' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>Access your classroom dashboard</p>
        </div>

        {/* Demo shortcuts */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 500, marginBottom: 8 }}>QUICK DEMO ACCESS</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEMOS.map(d => (
              <button key={d.label} className="btn btn-secondary btn-sm" style={{ flex: 1, borderColor: d.color + '40', color: d.color }}
                onClick={() => { setEmail(d.email); setPassword(d.password) }}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.edu" required autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}
          <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '11px' }} disabled={loading}>
            {loading ? <span className="spinner spin" /> : 'Sign in →'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 24 }}>
          For CBC STEM classrooms · Grades 7–12 · Kenya
        </p>
      </div>
    </div>
  )
}
