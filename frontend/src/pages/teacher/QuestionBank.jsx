import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

export default function QuestionBank() {
  const [questions, setQuestions] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject_id: '', topic: '', type: 'multiple_choice', marks: 10, content_json: { text: '', options: ['', '', '', ''] }, correct_answer: '0' })

  async function load(subjectId = filter) {
    const d = await api.teacher.questionBank(subjectId || undefined)
    setQuestions(d.questions)
  }

  useEffect(() => {
    api.teacher.subjects().then(d => setSubjects(d.subjects))
    load()
  }, [])

  function updateOption(i, val) {
    const options = [...form.content_json.options]; options[i] = val
    setForm(f => ({ ...f, content_json: { ...f.content_json, options } }))
  }

  async function save(e) {
    e.preventDefault()
    const { question } = await api.teacher.addToBank(form)
    setQuestions(qs => [question, ...qs])
    setShowForm(false)
    setForm({ subject_id: form.subject_id, topic: '', type: 'multiple_choice', marks: 10, content_json: { text: '', options: ['', '', '', ''] }, correct_answer: '0' })
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div><h1 className="page-title">Question bank</h1><p className="page-sub">Questions are stored per subject you teach</p></div>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? '✕ Cancel' : '+ Add question'}</button>
        </div>
      </div>
      <div className="page-body">
        <div style={{ marginBottom: 16, maxWidth: 240 }}>
          <select value={filter} onChange={e => { setFilter(e.target.value); load(e.target.value) }}>
            <option value="">All my subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {showForm && (
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <form onSubmit={save}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <select required value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                    <option value="">Select…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Topic</label>
                  <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} placeholder="Photosynthesis" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Marks</label>
                  <input type="number" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: +e.target.value }))} min={1} max={20} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Question text</label>
                <textarea value={form.content_json.text} onChange={e => setForm(f => ({ ...f, content_json: { ...f.content_json, text: e.target.value } }))} placeholder="Write your question…" />
              </div>
              <label className="form-label">Options <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>(select correct)</span></label>
              {form.content_json.options.map((o, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
                  <input type="radio" name="correct" checked={form.correct_answer === String(i)} onChange={() => setForm(f => ({ ...f, correct_answer: String(i) }))} style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <input value={o} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}
              <button className="btn btn-primary" type="submit" style={{ marginTop: 12 }}>Save to bank</button>
            </form>
          </div>
        )}

        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No questions yet</div>
            <div style={{ fontSize: 14 }}>Add reusable questions for each subject you teach.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.map(q => (
              <div className="card" key={q.id} style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {q.subject && <span className="tag tag-blue">{q.subject}</span>}
                  {q.topic && <span className="tag tag-gray">{q.topic}</span>}
                  <span className="tag tag-amber">{q.marks} marks</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--gray-800)', lineHeight: 1.6 }}>{q.content_json?.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
