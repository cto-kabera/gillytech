import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'
import { api } from '../../lib/api'

const NAV = [
  { path: '/admin', icon: '📊', label: 'Overview' },
  { path: '/admin/users', icon: '👥', label: 'Users' },
  { path: '/admin/subjects', icon: '📘', label: 'Subjects' },
  { path: '/admin/classes', icon: '🏫', label: 'Classes' },
]

export function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={NAV} />
      <main className="main-content"><Outlet /></main>
    </div>
  )
}

export function AdminDashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()
  useEffect(() => { api.admin.overview().then(setData) }, [])

  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>

  const { stats, recentSessions, teachers } = data

  const statItems = [
    { label: 'Schools', value: stats.schools, icon: '🏢', color: 'var(--brand)' },
    { label: 'Teachers', value: stats.teachers, icon: '👨‍🏫', color: 'var(--info)' },
    { label: 'Students', value: stats.students, icon: '👩‍🎓', color: 'var(--success)' },
    { label: 'Classes', value: stats.classes, icon: '🏫', color: 'var(--warning)' },
    { label: 'Sessions', value: stats.sessions, icon: '📋', color: 'var(--brand)' },
    { label: 'Active now', value: stats.active_sessions, icon: '🟢', color: 'var(--success)' },
    { label: 'Submissions', value: stats.total_submissions, icon: '📝', color: 'var(--gray-700)' },
    { label: 'Accuracy', value: `${stats.overall_accuracy}%`, icon: '🎯', color: 'var(--success)' },
    { label: 'Badges', value: stats.badges_awarded, icon: '🏅', color: '#7c3aed' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform overview</h1>
        <p className="page-sub">Gillytech · Admin console</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          {statItems.map(s => (
            <div className="stat-card" key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Recent sessions */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 14 }}>Recent sessions</div>
            <table className="table">
              <thead><tr><th>Session</th><th>Teacher</th><th>Status</th></tr></thead>
              <tbody>
                {recentSessions.map(s => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/teacher/sessions/${s.id}/analytics`)}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{s.class_name}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{s.teacher_name}</td>
                    <td>
                      {s.status === 'active' ? <span className="badge badge-green">● Live</span> :
                       s.status === 'draft'   ? <span className="badge badge-gray">Draft</span> :
                       <span className="badge badge-blue">Done</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Teachers */}
          <div className="card">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 14 }}>Teachers</div>
            <table className="table">
              <thead><tr><th>Teacher</th><th>Classes</th><th>Sessions</th></tr></thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{t.subject || 'STEM'}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{t.class_count}</td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{t.session_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
