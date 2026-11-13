import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'

function formatMs(ms) {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function AdminHistory() {
  const [params, setParams] = useSearchParams()
  const [students, setStudents] = useState([])
  const [entries, setEntries] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [pseudonymised, setPseudonymised] = useState(false)
  const studentId = params.get('studentId') || ''
  const sessionId = params.get('sessionId') || ''

  useEffect(() => {
    api.admin.users('student').then(d => setStudents(d.users || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    api.admin.history({
      studentId: studentId || undefined,
      sessionId: sessionId || undefined,
      limit: 50
    })
      .then(d => setEntries(d.entries || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [studentId, sessionId])

  const sessionOpts = [...new Map(entries.map(e => [e.sessionId, e.sessionTitle])).entries()]

  function setFilter(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  async function exportFile(format) {
    setExporting(true)
    setError('')
    try {
      await api.admin.exportHistory({
        studentId: studentId || undefined,
        sessionId: sessionId || undefined,
        format,
        pseudonymised
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reasoning history</h1>
        <p className="page-sub">Per-question reasoning, scores, and timing — admin only</p>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select value={studentId} onChange={e => setFilter('studentId', e.target.value)} style={{ minWidth: 220 }}>
            <option value="">All students</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>
          <select value={sessionId} onChange={e => setFilter('sessionId', e.target.value)} style={{ minWidth: 220 }}>
            <option value="">All sessions</option>
            {sessionOpts.map(([id, title]) => (
              <option key={id} value={id}>{title}</option>
            ))}
          </select>
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={pseudonymised} onChange={e => setPseudonymised(e.target.checked)} />
            Pseudonymise (IDs only, no name/email)
          </label>
          <button className="btn btn-secondary btn-sm" disabled={exporting} onClick={() => exportFile('csv')}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn btn-secondary btn-sm" disabled={exporting} onClick={() => exportFile('json')}>
            Export JSON
          </button>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner spin" /></div>}
        {!loading && !error && entries.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>No submissions yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(e => (
            <div key={e.submissionId} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{e.studentName}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{e.studentEmail} · {e.sessionTitle} · {e.subject || 'STEM'}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(e.submittedAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${e.isCorrect ? 'badge-green' : 'badge-gray'}`}>{e.isCorrect ? 'Correct' : 'Incorrect'}</span>
                  {e.isFirstCorrect && <span className="badge badge-amber">First correct</span>}
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--brand)' }}>{e.score.total} pts</span>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>{e.questionText || 'Question'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10, fontSize: 13 }}>
                <div>Selected: <strong>{e.selectedAnswer}</strong></div>
                <div>Correct: <strong>{e.correctAnswer}</strong></div>
              </div>
              <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>
                {e.reasoningText || '—'}
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 6 }}>{e.reasoningCharCount} chars · reasoning bonus {e.score.reasoningBonus ? '+2' : '+0'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                <span>Base {e.score.base}</span>
                <span>First {e.score.firstCorrectBonus}</span>
                <span>Reasoning {e.score.reasoningBonus}</span>
                {e.timing?.totalTimeMs != null && <span>Time {formatMs(e.timing.totalTimeMs)}</span>}
                {e.timing?.planningLatencyMs != null && <span>Planning {formatMs(e.timing.planningLatencyMs)}</span>}
                {e.timing?.activeReasoningMs != null && <span>Active {formatMs(e.timing.activeReasoningMs)}</span>}
                {e.timing?.flags?.suspectRapid && <span>Rapid guess</span>}
                {e.timing?.flags?.backgrounded && <span>Tab backgrounded</span>}
                {e.timing?.flags?.clientMarksDropped && <span>Client marks dropped</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
