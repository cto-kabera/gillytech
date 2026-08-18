import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

export function SessionsList() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.teacher.sessions().then(d => setSessions(d.sessions)).finally(() => setLoading(false)) }, [])

  const statusBadge = s => {
    if (s.status === 'active') return <span className="badge badge-green">● Live</span>
    if (s.status === 'draft') return <span className="badge badge-gray">Draft</span>
    return <span className="badge badge-blue">Completed</span>
  }

  async function activate(id) {
    await api.teacher.patchSession(id, { status: 'active' })
    const d = await api.teacher.sessions(); setSessions(d.sessions)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1 className="page-title">Sessions</h1><p className="page-sub">All classroom sessions</p></div>
          <button className="btn btn-primary" onClick={() => navigate('/teacher/sessions/new')}>+ New session</button>
        </div>
      </div>
      <div className="page-body">
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner spin" /></div> : (
          <div className="card">
            <table className="table">
              <thead><tr><th>Session</th><th>Class</th><th>Questions</th><th>Submissions</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {sessions.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No sessions yet. Create one to get started.</td></tr>}
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.title}</td>
                    <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{s.class_name}</td>
                    <td><span className="mono" style={{ fontSize: 13 }}>{s.question_count}</span></td>
                    <td><span className="mono" style={{ fontSize: 13 }}>{s.submission_count}</span></td>
                    <td>{statusBadge(s)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {s.status === 'active' && <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/teacher/sessions/${s.id}/live`)}>Monitor</button>}
                        {s.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => activate(s.id)}>Launch</button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/sessions/${s.id}/analytics`)}>Analytics</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export function ClassesList() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', grade_level: '', subject: '' })
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])

  const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
  const avatarColor = name => AVATAR_COLORS[(name||'').charCodeAt(0) % AVATAR_COLORS.length]

  useEffect(() => { api.teacher.classes().then(d => setClasses(d.classes)).finally(() => setLoading(false)) }, [])

  async function createClass(e) {
    e.preventDefault()
    const { class: cls } = await api.teacher.createClass(form)
    setClasses(c => [...c, { ...cls, enrolled: 0, sessions: 0 }])
    setShowNew(false); setForm({ name: '', grade_level: '', subject: '' })
  }

  async function loadStudents(cls) {
    setSelectedClass(cls)
    const d = await api.teacher.classStudents(cls.id)
    setStudents(d.students)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spin" /></div>

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><h1 className="page-title">Classes</h1><p className="page-sub">Manage your classrooms and student rosters</p></div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New class</button>
        </div>
      </div>
      <div className="page-body">
        {showNew && (
          <div className="card" style={{ padding: 20, marginBottom: 20, border: '1.5px solid var(--brand-light)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New class</h3>
            <form onSubmit={createClass}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Class name</label>
                  <input value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="Form 3 Biology" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Grade level</label>
                  <input value={form.grade_level} onChange={e => setForm(f=>({...f, grade_level: e.target.value}))} placeholder="Grade 9" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject</label>
                  <input value={form.subject} onChange={e => setForm(f=>({...f, subject: e.target.value}))} placeholder="Biology" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" type="submit">Create class</button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowNew(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selectedClass ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div>
            {classes.map(c => (
              <div key={c.id} className="card" style={{ padding: 16, marginBottom: 10, cursor: 'pointer', border: selectedClass?.id === c.id ? '1.5px solid var(--brand)' : '' }} onClick={() => loadStudents(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10 }}>{c.subject} · {c.grade_level}</div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--gray-600)' }}>
                      <span>👥 {c.enrolled} students</span>
                      <span>📋 {c.sessions} sessions</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-light)', padding: '4px 10px', borderRadius: 6 }}>{c.join_code}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>join code</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {selectedClass && (
            <div className="card" style={{ padding: 0, height: 'fit-content' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedClass.name} — Students</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedClass(null)}>✕</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {students.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--gray-100)' }}>
                    <div className="avatar avatar-sm" style={{ background: avatarColor(s.name) }}>{s.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.email}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)', textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--mono)', color: 'var(--brand)', fontWeight: 600 }}>{s.total_score}pts</div>
                      <div>{s.badges} badges</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
