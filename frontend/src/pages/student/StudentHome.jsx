import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import { useAuth } from '../../hooks/useAuth'
import { api } from '../../lib/api'

const NAV = [
  { path: '/student',         icon: '🏠', label: 'Home' },
  { path: '/student/profile', icon: '👤', label: 'My profile' },
]

export function StudentLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={NAV} />
      <main className="main-content"><Outlet /></main>
    </div>
  )
}

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d','#0f766e']
const avatarColor = name => AVATAR_COLORS[(name||'').charCodeAt(0) % AVATAR_COLORS.length]

export function StudentHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => { api.student.profile().then(setProfile).catch(() => {}) }, [])

  async function join(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await api.student.join(code.trim().toUpperCase())
      navigate(`/student/session/${data.session.id}`, { state: data })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const BADGE_LABELS = { first_correct: '⚡ First correct', full_participation: '💯 Full participation', top_reasoner: '🧠 Top reasoner' }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-sub">Enter your class code to join a live session.</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Join card */}
          <div>
            <div className="card" style={{ padding: 28, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Join a session</h2>
              <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>Your teacher will share the code at the start of class.</p>
              <form onSubmit={join}>
                <div className="form-group">
                  <label className="form-label">Class code</label>
                  <input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. BIO-2024"
                    style={{ fontFamily: 'var(--mono)', fontSize: 20, textAlign: 'center', letterSpacing: '.08em' }}
                    autoFocus required />
                </div>
                {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', padding: '9px 13px', fontSize: 13, color: 'var(--danger)', marginBottom: 14 }}>{error}</div>}
                <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading || !code.trim()}>
                  {loading ? <span className="spinner spin" /> : 'Join session →'}
                </button>
              </form>
            </div>
            <div style={{ background: 'var(--brand-light)', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 13, color: 'var(--brand-dark)' }}>
              💡 Try <strong className="mono">BIO-2024</strong> to join the demo Biology session
            </div>
          </div>

          {/* Stats */}
          {profile && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Total score', value: profile.stats.total_score, icon: '⭐' },
                  { label: 'Accuracy', value: `${profile.stats.accuracy}%`, icon: '🎯' },
                  { label: 'Badges', value: profile.stats.badges_count, icon: '🏅' },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span className="stat-label">{s.label}</span>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                    </div>
                    <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {profile.badges.length > 0 && (
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent badges</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {profile.badges.slice(0, 8).map(b => (
                      <span key={b.id} className="badge badge-purple">{BADGE_LABELS[b.badge_type] || b.badge_type}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
