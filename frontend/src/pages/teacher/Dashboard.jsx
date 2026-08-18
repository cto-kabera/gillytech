import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.teacher.sessions(), api.teacher.classes()])
      .then(([s, c]) => { setSessions(s.sessions); setClasses(c.classes) })
      .finally(() => setLoading(false))
  }, [])

  const active = sessions.filter(s => s.status === 'active')
  const recent = sessions.filter(s => s.status !== 'active').slice(0, 5)

  const statusBadge = s => {
    if (s.status === 'active') return <span className="badge badge-green">● Live</span>
    if (s.status === 'draft') return <span className="badge badge-gray">Draft</span>
    return <span className="badge badge-blue">Completed</span>
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Good morning, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-sub">Here's what's happening in your classroom today.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/teacher/sessions/new')}>+ New session</button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Active sessions', value: active.length, icon: '🟢', color: 'var(--success)' },
            { label: 'Total sessions', value: sessions.length, icon: '📋', color: 'var(--brand)' },
            { label: 'Classes', value: classes.length, icon: '🏫', color: 'var(--warning)' },
            { label: 'Total students', value: classes.reduce((a, c) => a + (c.enrolled || 0), 0), icon: '👥', color: 'var(--info)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Active sessions */}
        {active.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Live sessions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {active.map(s => (
                <div className="card" key={s.id} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, border: '1.5px solid var(--success-border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>{s.class_name} · {s.question_count} questions · {s.submission_count} submissions</div>
                  </div>
                  {statusBadge(s)}
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/teacher/sessions/${s.id}/live`)}>Monitor →</button>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate(`/teacher/sessions/${s.id}/analytics`)}>Analytics</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Recent sessions</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/sessions')}>View all</button>
          </div>
          <div className="card">
            <table className="table">
              <thead><tr><th>Session</th><th>Class</th><th>Questions</th><th>Submissions</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recent.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No completed sessions yet.</td></tr>}
                {recent.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.title}</td>
                    <td style={{ color: 'var(--gray-500)' }}>{s.class_name}</td>
                    <td><span className="mono" style={{ fontSize: 13 }}>{s.question_count}</span></td>
                    <td><span className="mono" style={{ fontSize: 13 }}>{s.submission_count}</span></td>
                    <td>{statusBadge(s)}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/sessions/${s.id}/analytics`)}>Analytics</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Classes */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>My classes</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher/classes')}>Manage</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
            {classes.map(c => (
              <div className="card" key={c.id} style={{ padding: 20, cursor: 'pointer' }} onClick={() => navigate('/teacher/classes')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{c.name}</div>
                  <span className="mono" style={{ fontSize: 12, background: 'var(--brand-light)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 4 }}>{c.join_code}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>{c.subject} · {c.grade_level}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--gray-600)' }}>
                  <span>👥 {c.enrolled} students</span>
                  <span>📋 {c.sessions} sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
