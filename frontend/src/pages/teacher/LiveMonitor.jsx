import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useWebSocket } from '../../hooks/useWebSocket'

export default function LiveMonitor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [advancing, setAdvancing] = useState(false)

  async function load() {
    try { const d = await api.teacher.live(id); setData(d) } catch {}
  }

  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t) }, [id])

  const handleWs = useCallback(msg => {
    if (['chat','presence','submission'].includes(msg.type)) load()
  }, [id])
  useWebSocket(id, handleWs)

  async function advance() {
    if (!data) return
    setAdvancing(true)
    try { await api.teacher.patchSession(id, { current_question_index: data.question_index + 1 }); await load() }
    catch (e) { alert(e.message) }
    finally { setAdvancing(false) }
  }

  async function endSession() {
    if (!confirm('End this session?')) return
    await api.teacher.patchSession(id, { status: 'completed' })
    navigate(`/teacher/sessions/${id}/analytics`)
  }

  if (!data) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>

  const { session, current_question, question_index, total_questions, enrolled_count, submitted_count, correct_count, groupStatus, submissions } = data
  const pct = enrolled_count ? Math.round(submitted_count / enrolled_count * 100) : 0

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher')}>← Back</button>
            <div>
              <h1 className="page-title">{session.title}</h1>
              <p className="page-sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-green pulse">● Live</span>
                Question {question_index + 1} of {total_questions}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {question_index < total_questions - 1 && (
              <button className="btn btn-primary" onClick={advance} disabled={advancing}>
                {advancing ? <span className="spinner spin" /> : 'Next question →'}
              </button>
            )}
            <button className="btn btn-danger" onClick={endSession}>End session</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Progress stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Enrolled', value: enrolled_count, icon: '👥' },
            { label: 'Submitted', value: `${submitted_count} (${pct}%)`, icon: '✅' },
            { label: 'Correct', value: submitted_count ? `${correct_count} (${Math.round(correct_count/submitted_count*100)}%)` : '—', icon: '🎯' },
            { label: 'Question', value: `${question_index + 1} / ${total_questions}`, icon: '📋' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="stat-label">{s.label}</span>
                <span style={{ fontSize: 16 }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Submission progress bar */}
        <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gray-600)', marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>Class response progress</span>
            <span style={{ fontFamily: 'var(--mono)' }}>{submitted_count} / {enrolled_count}</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--brand)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Current question */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>Current question</h3>
            {current_question ? (
              <div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--gray-800)', marginBottom: 16 }}>{current_question.content_json?.text}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="badge badge-blue">Q{question_index + 1}</span>
                  <span className="badge badge-amber">{current_question.marks} marks</span>
                  <span className="badge badge-gray">{current_question.time_limit_sec}s</span>
                </div>
              </div>
            ) : <p style={{ color: 'var(--gray-400)' }}>No question active</p>}
          </div>

          {/* Group status */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 12 }}>Group status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {groupStatus.map(g => {
                const pct = g.member_count ? Math.round(g.submitted_count / g.member_count * 100) : 0
                return (
                  <div key={g.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--gray-500)' }}>
                        <span>{g.submitted_count}/{g.member_count} submitted</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand)' }}>{g.total_score}pts</span>
                      </div>
                    </div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: g.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Student submissions */}
        {submissions.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 14 }}>
              Student responses <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>({submissions.length})</span>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {submissions.map(s => (
                <div key={s.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{s.student_name}</span>
                      <span className={`badge ${s.is_correct ? 'badge-green' : 'badge-red'}`}>{s.is_correct ? '✓ Correct' : '✗ Wrong'}</span>
                      {s.is_first_correct && <span className="badge badge-amber">⚡ First!</span>}
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--brand)', marginLeft: 'auto' }}>{s.score}pts</span>
                    </div>
                    {s.reasoning_text && (
                      <p style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5, background: 'var(--gray-50)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--gray-200)' }}>
                        {s.reasoning_text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
