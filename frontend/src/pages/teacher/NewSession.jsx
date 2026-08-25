import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

const EMPTY_Q = () => ({
  _id: Math.random().toString(36).slice(2), type: 'multiple_choice', marks: 10, time_limit_sec: 120,
  content_json: { text: '', options: ['', '', '', ''] }, correct_answer: '0'
})

export default function NewSession() {
  const navigate = useNavigate()
  const [classes, setClasses] = useState([])
  const [form, setForm] = useState({ title: '', class_id: '' })
  const [bank, setBank] = useState([])
  const [selectedBank, setSelectedBank] = useState([])
  const [questions, setQuestions] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { api.teacher.classes().then(d => setClasses(d.classes)) }, [])

  const selectedClass = classes.find(c => c.id === form.class_id)

  useEffect(() => {
    if (!selectedClass?.subject_id) { setBank([]); return }
    api.teacher.questionBank(selectedClass.subject_id).then(d => setBank(d.questions)).catch(() => setBank([]))
    setSelectedBank([])
  }, [selectedClass?.subject_id])

  function toggleBank(id) {
    setSelectedBank(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
  }

  function updateQ(idx, patch) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }
  function updateQContent(idx, patch) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, content_json: { ...q.content_json, ...patch } } : q))
  }
  function updateOption(qIdx, optIdx, val) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      const options = [...q.content_json.options]
      options[optIdx] = val
      return { ...q, content_json: { ...q.content_json, options } }
    }))
  }

  async function handleSubmit(status = 'draft') {
    if (!form.title || !form.class_id) { setError('Title and class are required'); return }
    if (!selectedBank.length && !questions.length) { setError('Add questions from the bank or create new ones'); return }
    setSaving(true); setError('')
    try {
      const qs = questions.map(({ _id, ...q }) => q)
      const { session } = await api.teacher.createSession({ ...form, questions: qs, bank_ids: selectedBank })
      if (status === 'active') await api.teacher.patchSession(session.id, { status: 'active' })
      navigate('/teacher/sessions')
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teacher')}>← Back</button>
        </div>
        <h1 className="page-title">New session</h1>
        <p className="page-sub">Pick from the subject question bank, or write new questions (they are saved to the bank).</p>
      </div>

      <div className="page-body">
        {error && <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}

        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Session details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Session title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Photosynthesis — Unit 4" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Class</label>
              <select value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
                <option value="">Select a class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {c.subject_name || 'No subject'} ({c.join_code})</option>)}
              </select>
            </div>
          </div>
        </div>

        {form.class_id && (
          <div className="card" style={{ padding: 20, marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>From question bank</h2>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
              Showing {selectedClass?.subject_name || 'this class'} questions. Select any to include.
            </p>
            {bank.length === 0 && <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>No bank questions for this subject yet.</div>}
            {bank.map(q => (
              <label key={q.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                <input type="checkbox" checked={selectedBank.includes(q.id)} onChange={() => toggleBank(q.id)} style={{ marginTop: 3 }} />
                <span><strong>{q.topic ? `${q.topic}: ` : ''}</strong>{q.content_json?.text}</span>
              </label>
            ))}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>New questions <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--gray-500)' }}>({questions.length})</span></h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setQuestions(qs => [...qs, EMPTY_Q()])}>+ Create question</button>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>New questions are saved to the question bank for this class’s subject.</p>

          {questions.map((q, qi) => (
            <div className="card" key={q._id} style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ background: 'var(--brand)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{qi + 1}</span>
                <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                  <select style={{ width: 160 }} value={q.type} onChange={e => updateQ(qi, { type: e.target.value })}>
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="true_false">True / False</option>
                  </select>
                  <input type="number" style={{ width: 90 }} value={q.marks} min={1} max={20} onChange={e => updateQ(qi, { marks: +e.target.value })} />
                  <input type="number" style={{ width: 110 }} value={q.time_limit_sec} min={30} max={300} onChange={e => updateQ(qi, { time_limit_sec: +e.target.value })} />
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}>✕</button>
              </div>
              <div className="form-group">
                <label className="form-label">Question text</label>
                <textarea value={q.content_json.text} onChange={e => updateQContent(qi, { text: e.target.value })} placeholder="Enter your question…" style={{ minHeight: 80 }} />
              </div>
              {q.type === 'multiple_choice' && (
                <div>
                  <label className="form-label">Answer options <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(select the correct one)</span></label>
                  {q.content_json.options.map((opt, oi) => (
                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <input type="radio" name={`correct-${q._id}`} checked={q.correct_answer === String(oi)} onChange={() => updateQ(qi, { correct_answer: String(oi) })} style={{ width: 16, height: 16, flexShrink: 0 }} />
                      <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} style={{ flex: 1 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => handleSubmit('draft')} disabled={saving}>Save as draft</button>
          <button className="btn btn-primary" onClick={() => handleSubmit('active')} disabled={saving}>
            {saving ? <span className="spinner spin" /> : '🚀 Launch session'}
          </button>
        </div>
      </div>
    </div>
  )
}
