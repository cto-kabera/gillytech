import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

const BADGE_META = {
  first_correct:     { icon: '⚡', label: 'First correct', desc: 'First to answer correctly', color: 'badge-amber' },
  full_participation:{ icon: '💯', label: 'Full participation', desc: 'Answered every question', color: 'badge-green' },
  top_reasoner:      { icon: '🧠', label: 'Top reasoner', desc: 'Excellent reasoning quality', color: 'badge-purple' },
}

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
const avatarColor = name => AVATAR_COLORS[(name||'').charCodeAt(0) % AVATAR_COLORS.length]

export default function StudentProfile() {
  const [profile, setProfile] = useState(null)
  useEffect(() => { api.student.profile().then(setProfile) }, [])

  if (!profile) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>

  const { user, stats, badges } = profile
  const badgeCounts = {}
  for (const b of badges) badgeCounts[b.badge_type] = (badgeCounts[b.badge_type] || 0) + 1

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My profile</h1>
        <p className="page-sub">Your learning progress and achievements</p>
      </div>
      <div className="page-body">
        {/* Profile card */}
        <div className="card" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="avatar avatar-xl" style={{ background: avatarColor(user.name) }}>{user.avatar}</div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</h2>
            <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>{user.email}</p>
            <p style={{ color: 'var(--gray-400)', fontSize: 13, marginTop: 2 }}>{user.school_id && 'Nairobi STEM Academy'}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total score', value: stats.total_score, icon: '⭐', color: 'var(--warning)' },
            { label: 'Accuracy', value: `${stats.accuracy}%`, icon: '🎯', color: 'var(--success)' },
            { label: 'Submissions', value: stats.total_submissions, icon: '📝', color: 'var(--brand)' },
            { label: 'Badges earned', value: stats.badges_count, icon: '🏅', color: 'var(--purple, #7c3aed)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* CBC competency bar */}
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>CBC competency indicators</h3>
          {[
            { label: 'Critical thinking & problem solving', value: stats.accuracy, color: 'var(--brand)' },
            { label: 'Reasoning quality', value: stats.total_submissions > 0 ? Math.min(100, Math.round(stats.accuracy * 0.9)) : 0, color: 'var(--warning)' },
            { label: 'Participation & engagement', value: stats.total_submissions > 0 ? 85 : 0, color: 'var(--success)' },
          ].map(c => (
            <div key={c.label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--gray-700)' }}>{c.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: c.color }}>{c.value}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${c.value}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Badges earned</h3>
          {Object.keys(badgeCounts).length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No badges yet — participate in sessions to earn them!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {Object.entries(badgeCounts).map(([type, count]) => {
                const meta = BADGE_META[type] || { icon: '🏅', label: type, desc: '', color: 'badge-gray' }
                return (
                  <div key={type} style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 6 }}>{meta.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{meta.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>{meta.desc}</div>
                    <span className={`badge ${meta.color}`}>×{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
