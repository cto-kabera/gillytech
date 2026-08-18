import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d','#0f766e']
const avatarColor = name => AVATAR_COLORS[(name||'').charCodeAt(0) % AVATAR_COLORS.length]

export default function Analytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('overview')

  useEffect(() => { api.teacher.analytics(id).then(setData) }, [id])

  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>

  const { session, enrolled, active_students, total_submissions, overall_accuracy, studentLeaderboard, groupLeaderboard, questionStats, cbcScores } = data

  const TABS = ['overview', 'students', 'questions', 'cbc']

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher')}>← Back</button>
          <span className={`badge ${session.status === 'active' ? 'badge-green' : 'badge-blue'}`}>{session.status}</span>
        </div>
        <h1 className="page-title">{session.title}</h1>
        <p className="page-sub">Session analytics & CBC competency report</p>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Enrolled', value: enrolled },
            { label: 'Participated', value: active_students },
            { label: 'Submissions', value: total_submissions },
            { label: 'Accuracy', value: `${overall_accuracy}%` },
            { label: 'Questions', value: data.question_count },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 24 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--gray-100)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font)',
              background: tab === t ? 'var(--white)' : 'transparent', color: tab === t ? 'var(--gray-900)' : 'var(--gray-500)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none', transition: 'all .15s', textTransform: 'capitalize'
            }}>{t === 'cbc' ? 'CBC Competencies' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Group leaderboard */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Group leaderboard</h3>
              {groupLeaderboard.map((g, i) => (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < groupLeaderboard.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--gray-400)', width: 20 }}>#{i+1}</span>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{g.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{g.correct} correct</span>
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--brand)', fontSize: 15 }}>{g.total}pts</span>
                </div>
              ))}
            </div>
            {/* Question accuracy */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Question accuracy</h3>
              {questionStats.map((q, i) => (
                <div key={q.id} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <span style={{ color: 'var(--gray-600)', flex: 1, marginRight: 12 }}>Q{i+1}: {q.text}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: q.accuracy >= 70 ? 'var(--success)' : q.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)', flexShrink: 0 }}>{q.accuracy}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${q.accuracy}%`, background: q.accuracy >= 70 ? 'var(--success)' : q.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students tab */}
        {tab === 'students' && (
          <div className="card">
            <table className="table">
              <thead><tr><th>#</th><th>Student</th><th>Group</th><th>Score</th><th>Correct</th><th>Avg reasoning</th></tr></thead>
              <tbody>
                {studentLeaderboard.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--gray-400)' }}>#{i+1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: avatarColor(s.name) }}>{s.avatar}</div>
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>
                    <td>
                      {s.group_name && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.group_color }} />
                        <span style={{ fontSize: 13 }}>{s.group_name}</span>
                      </div>}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--brand)' }}>{s.total}</td>
                    <td><span className="badge badge-green">{s.correct}/{s.count}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{s.reasoning_chars > 0 ? `${Math.round(s.reasoning_chars/s.count)} chars avg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Questions tab */}
        {tab === 'questions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {questionStats.map((q, i) => (
              <div className="card" key={q.id} style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ background: 'var(--brand)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--gray-800)', flex: 1 }}>{q.text}</p>
                  <span className={`badge ${q.accuracy >= 70 ? 'badge-green' : q.accuracy >= 40 ? 'badge-amber' : 'badge-red'}`}>{q.accuracy}% correct</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {q.options.map((opt, oi) => {
                    const count = q.option_distribution[oi] || 0
                    const total = q.total_attempts || 1
                    const pct = Math.round(count / total * 100)
                    const isCorrect = String(oi) === String(q.correct_answer)
                    return (
                      <div key={oi} style={{ padding: '10px 12px', borderRadius: 'var(--radius)', background: isCorrect ? 'var(--success-bg)' : 'var(--gray-50)', border: `1px solid ${isCorrect ? 'var(--success-border)' : 'var(--gray-200)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                          <span style={{ color: isCorrect ? 'var(--success)' : 'var(--gray-600)', fontWeight: isCorrect ? 600 : 400 }}>
                            {String.fromCharCode(65+oi)}: {opt.slice(0, 60)}{opt.length > 60 ? '…' : ''}
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: isCorrect ? 'var(--success)' : 'var(--gray-500)', flexShrink: 0, marginLeft: 8 }}>{count} ({pct}%)</span>
                        </div>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: isCorrect ? 'var(--success)' : 'var(--gray-300)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--gray-500)' }}>
                  {q.total_attempts} responses · avg reasoning length: {q.avg_reasoning_length} chars
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CBC tab */}
        {tab === 'cbc' && (
          <div>
            <div style={{ background: 'var(--brand-light)', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 20, fontSize: 13, color: 'var(--brand-dark)' }}>
              <strong>CBC competency scores</strong> are inferred from performance: critical thinking from accuracy, reasoning from submission length, and participation from question completion rate. These are indicative — teacher judgement should supplement automated scores.
            </div>
            <div className="card">
              <table className="table">
                <thead><tr><th>Student</th><th>Critical thinking</th><th>Reasoning quality</th><th>Participation</th></tr></thead>
                <tbody>
                  {cbcScores.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      {[s.critical_thinking, s.reasoning, s.participation].map((val, i) => (
                        <td key={i}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="progress-bar" style={{ height: 6, flex: 1 }}>
                              <div className="progress-fill" style={{ width: `${val}%`, background: val >= 70 ? 'var(--success)' : val >= 40 ? 'var(--warning)' : 'var(--danger)' }} />
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, width: 32 }}>{val}%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
