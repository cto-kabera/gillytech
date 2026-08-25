import { useState, useEffect } from 'react'
import { api } from '../../lib/api'

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher', subject_ids: [] })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [u, s] = await Promise.all([api.admin.users(), api.admin.subjects()])
    setUsers(u.users); setSubjects(s.subjects)
  }
  useEffect(() => { load() }, [])

  function toggleSubject(id) {
    setForm(f => ({
      ...f,
      subject_ids: f.subject_ids.includes(id) ? f.subject_ids.filter(x => x !== id) : [...f.subject_ids, id]
    }))
  }

  async function create(e) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await api.admin.createUser(form)
      setForm({ name: '', email: '', password: '', role: 'teacher', subject_ids: [] })
      await load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function remove(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try { await api.admin.deleteUser(id); await load() }
    catch (err) { alert(err.message) }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-sub">Create teachers (with subjects), students, and admins</p>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New user</h3>
          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 140px', gap: 10, marginBottom: 12 }}>
              <input required placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <input required type="password" placeholder="Temp password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value, subject_ids: [] }))}>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === 'teacher' && (
              <div style={{ marginBottom: 12 }}>
                <div className="form-label">Subjects this teacher can teach</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {subjects.map(s => (
                    <label key={s.id} style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" checked={form.subject_ids.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                      {s.name}
                    </label>
                  ))}
                  {subjects.length === 0 && <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>Create subjects first</span>}
                </div>
              </div>
            )}
            <button className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Create user'}</button>
          </form>
        </div>

        <div className="card">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Subjects</th><th></th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{u.email}</td>
                  <td><span className="badge badge-gray">{u.role}</span></td>
                  <td style={{ fontSize: 12 }}>{(u.subjects || []).map(s => s.name).join(', ') || u.subject || '—'}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => remove(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AdminSubjects() {
  const [subjects, setSubjects] = useState([])
  const [name, setName] = useState('')
  useEffect(() => { api.admin.subjects().then(d => setSubjects(d.subjects)) }, [])

  async function create(e) {
    e.preventDefault()
    const { subject } = await api.admin.createSubject({ name })
    setSubjects(s => [...s, subject]); setName('')
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Subjects</h1>
        <p className="page-sub">Catalog used for classes, teachers, and the question bank</p>
      </div>
      <div className="page-body">
        <form onSubmit={create} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Biology" required style={{ maxWidth: 280 }} />
          <button className="btn btn-primary">Add subject</button>
        </form>
        <div className="card">
          <table className="table">
            <thead><tr><th>Subject</th></tr></thead>
            <tbody>
              {subjects.map(s => <tr key={s.id}><td>{s.name}</td></tr>)}
              {subjects.length === 0 && <tr><td style={{ color: 'var(--gray-400)' }}>No subjects yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function AdminClasses() {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ name: '', grade_level: '', teacher_id: '', subject_id: '' })
  const [enroll, setEnroll] = useState({ classId: '', student_ids: [], emails: '' })

  async function load() {
    const [c, t, s, sub] = await Promise.all([
      api.admin.classes(),
      api.admin.users('teacher'),
      api.admin.users('student'),
      api.admin.subjects()
    ])
    setClasses(c.classes); setTeachers(t.users); setStudents(s.users); setSubjects(sub.subjects)
  }
  useEffect(() => { load() }, [])

  async function create(e) {
    e.preventDefault()
    await api.admin.createClass(form)
    setForm({ name: '', grade_level: '', teacher_id: '', subject_id: '' })
    await load()
  }

  function toggleStudent(id) {
    setEnroll(f => ({
      ...f,
      student_ids: f.student_ids.includes(id) ? f.student_ids.filter(x => x !== id) : [...f.student_ids, id]
    }))
  }

  async function doEnroll(e) {
    e.preventDefault()
    if (!enroll.classId) return
    await api.admin.enroll(enroll.classId, { student_ids: enroll.student_ids, emails: enroll.emails })
    setEnroll({ classId: '', student_ids: [], emails: '' })
    await load()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Classes</h1>
        <p className="page-sub">Create classes and enroll students (one or many)</p>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>New class</h3>
          <form onSubmit={create}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <input required placeholder="Class name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Grade" value={form.grade_level} onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))} />
              <select required value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
                <option value="">Teacher…</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                <option value="">Subject…</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm">Create class</button>
          </form>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Enroll students</h3>
          <form onSubmit={doEnroll}>
            <div className="form-group">
              <label className="form-label">Class</label>
              <select required value={enroll.classId} onChange={e => setEnroll(f => ({ ...f, classId: e.target.value }))}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.join_code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Pick students</label>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 8 }}>
                {students.map(s => (
                  <label key={s.id} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '4px 0' }}>
                    <input type="checkbox" checked={enroll.student_ids.includes(s.id)} onChange={() => toggleStudent(s.id)} />
                    {s.name} <span style={{ color: 'var(--gray-400)' }}>{s.email}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Or paste emails (one per line)</label>
              <textarea value={enroll.emails} onChange={e => setEnroll(f => ({ ...f, emails: e.target.value }))} placeholder="amara@gillytech.dev" style={{ minHeight: 70 }} />
            </div>
            <button className="btn btn-primary btn-sm">Enroll</button>
          </form>
        </div>

        <div className="card">
          <table className="table">
            <thead><tr><th>Class</th><th>Teacher</th><th>Subject</th><th>Code</th><th>Enrolled</th></tr></thead>
            <tbody>
              {classes.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.teacher_name}</td>
                  <td>{c.subject_name || '—'}</td>
                  <td className="mono">{c.join_code}</td>
                  <td>{c.enrolled}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
