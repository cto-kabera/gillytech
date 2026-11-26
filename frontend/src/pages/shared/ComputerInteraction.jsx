import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

function fmtMs(ms) {
  if (ms == null) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

function StageCard({ stage }) {
  const entries = Object.entries(stage.metrics || {})
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Stage</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 2px' }}>{stage.title}</h3>
      <p style={{ fontSize: 12, color: 'var(--brand)', marginBottom: 14 }}>{stage.dimension}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
          <div style={{ color: 'var(--gray-500)', fontSize: 10, marginBottom: 2 }}>{label(k)}</div>
          <div style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{formatVal(k, v)}</div>
        </div>
      ))}
      </div>
    </div>
  )
}

function label(k) {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^avg /i, 'Avg ')
    .replace(/Ms$/, ' (ms)')
    .replace(/Pct$/, ' (%)')
}

function formatVal(k, v) {
  if (v == null || v === '') return '—'
  if (k.includes('Ms') && typeof v === 'number') return fmtMs(v)
  if (k.includes('Pct') || k.includes('Index')) return `${v}%`
  return String(v)
}

export function ComputerInteraction({ scope }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const load = scope === 'admin' ? api.admin.hci() : api.teacher.hci()
    load.then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [scope])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>
  if (error) return <p style={{ color: 'var(--danger)', padding: 24 }}>{error}</p>
  if (!data) return null

  const { summary, stage1, stage2, stage3, stage4, learnability, bySubmission } = data

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Computer Interaction</h1>
        <p className="page-sub">Stage-specific HCI measurables — reasoning lock, group chat, submission, and trust</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Submissions', value: summary.submissionCount },
            { label: 'Sessions', value: summary.sessionCount },
            { label: 'First-try accuracy', value: `${summary.accuracyPct}%` },
            { label: 'Avg SEQ (1–7)', value: summary.avgSeq ?? '—' },
            { label: 'SEQ responses', value: summary.surveyCount }
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <span className="stat-label">{s.label}</span>
              <div className="stat-value" style={{ fontSize: 22 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
          <StageCard stage={stage1} />
          <StageCard stage={stage2} />
          <StageCard stage={stage3} />
          <StageCard stage={stage4} />
        </div>

        {learnability?.length > 0 && (
          <div className="card" style={{ padding: 18, marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Learnability across sessions</h3>
            <table className="table">
              <thead><tr><th>Session #</th><th>Title</th><th>Avg time to submit</th><th>Submissions</th></tr></thead>
              <tbody>
                {learnability.map((row, i) => (
                  <tr key={row.sessionId || i}>
                    <td>{row.sessionIndex}</td>
                    <td>{bySubmission.find(b => b.sessionId === row.sessionId)?.sessionTitle || '—'}</td>
                    <td>{fmtMs(row.avgSubmitMs)}</td>
                    <td>{row.submissionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Per submission (HCI snapshot)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Session</th>
                <th>Draft</th>
                <th>Words</th>
                <th>Chat</th>
                <th>Unlock tries</th>
                <th>Option Δ</th>
                <th>Correct</th>
              </tr>
            </thead>
            <tbody>
              {bySubmission.slice(0, 30).map(row => {
                const s1 = row.hci?.stages?.preAnswerReasoning
                const s2 = row.hci?.stages?.groupDiscussion
                const s3 = row.hci?.stages?.answerSubmission
                return (
                  <tr key={row.submissionId}>
                    <td>{row.studentName}</td>
                    <td style={{ fontSize: 12 }}>{row.sessionTitle}</td>
                    <td>{fmtMs(s1?.draftTimeMs)}</td>
                    <td>{s1?.wordCount ?? '—'}</td>
                    <td>{s2?.messagesSent ?? '—'}</td>
                    <td>{s1?.unlockAttemptsBeforeValid ?? '—'}</td>
                    <td>{s3?.optionChangesAfterDiscussion ?? '—'}</td>
                    <td>{row.isCorrect ? '✓' : '✗'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}