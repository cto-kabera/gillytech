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
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/teacher/sessions/${s.id}/analytics`)}>
                          {s.status === 'completed' ? 'Review' : 'Analytics'}
                        </button>
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
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [students, setStudents] = useState([])

  const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
  const avatarColor = name => AVATAR_COLORS[(name||'').charCodeAt(0) % AVATAR_COLORS.length]

  async function load() {
    const [c, s] = await Promise.all([api.teacher.classes(), api.teacher.subjects()])
    setClasses(c.classes); setSubjects(s.subjects)
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  async function assignSubject(cls, subject_id) {
    const { class: updated } = await api.teacher.patchClass(cls.id, { subject_id })
    setClasses(list => list.map(c => c.id === cls.id ? { ...c, ...updated, enrolled: c.enrolled, sessions: c.sessions } : c))
    if (selectedClass?.id === cls.id) setSelectedClass(s => ({ ...s, ...updated }))
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
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-sub">Assign each class to a subject you teach. Rosters are managed by admin.</p>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: selectedClass ? '1fr 1fr' : '1fr', gap: 20 }}>
          <div>
            {classes.length === 0 && (
              <div style={{ color: 'var(--gray-400)', padding: 40, textAlign: 'center' }}>No classes assigned yet. Ask an admin to create a class for you.</div>
            )}
            {classes.map(c => (
              <div key={c.id} className="card" style={{ padding: 16, marginBottom: 10, cursor: 'pointer', border: selectedClass?.id === c.id ? '1.5px solid var(--brand)' : '' }} onClick={() => loadStudents(c)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{c.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 10 }}>{c.grade_level}</div>
                    <div onClick={e => e.stopPropagation()}>
                      <label className="form-label">Subject for this class</label>
                      <select value={c.subject_id || ''} onChange={e => assignSubject(c, e.target.value)}>
                        <option value="">Select subject…</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--gray-600)', marginTop: 10 }}>
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
