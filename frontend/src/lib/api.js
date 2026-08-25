const API_URL = import.meta.env.VITE_API_URL || ''
const BASE = `${API_URL}/api`

export const getToken = () => localStorage.getItem('gt_token')
export const setToken = t => localStorage.setItem('gt_token', t)
export const clearToken = () => localStorage.removeItem('gt_token')

async function req(path, opts = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  teacher: {
    classes: () => req('/teacher/classes'),
    createClass: body => req('/teacher/classes', { method: 'POST', body }),
    patchClass: (id, body) => req(`/teacher/classes/${id}`, { method: 'PATCH', body }),
    classStudents: id => req(`/teacher/classes/${id}/students`),
    subjects: () => req('/teacher/subjects'),
    sessions: () => req('/teacher/sessions'),
    createSession: body => req('/teacher/sessions', { method: 'POST', body }),
    patchSession: (id, body) => req(`/teacher/sessions/${id}`, { method: 'PATCH', body }),
    analytics: id => req(`/teacher/sessions/${id}/analytics`),
    review: id => req(`/teacher/sessions/${id}/review`),
    live: id => req(`/teacher/sessions/${id}/live`),
    questionBank: (subjectId) => req(`/teacher/question-bank${subjectId ? `?subject_id=${subjectId}` : ''}`),
    addToBank: body => req('/teacher/question-bank', { method: 'POST', body })
  },
  student: {
    join: code => req(`/student/join/${code}`),
    state: id => req(`/student/session/${id}/state`),
    submit: (id, body) => req(`/student/session/${id}/submit`, { method: 'POST', body }),
    leaderboard: id => req(`/student/session/${id}/leaderboard`),
    chat: (id, qid) => req(`/student/session/${id}/chat/${qid}`),
    sendChat: (id, body) => req(`/student/session/${id}/chat`, { method: 'POST', body }),
    profile: () => req('/student/profile')
  },
  admin: {
    overview: () => req('/admin/overview'),
    subjects: () => req('/admin/subjects'),
    createSubject: body => req('/admin/subjects', { method: 'POST', body }),
    users: (role) => req(`/admin/users${role ? `?role=${role}` : ''}`),
    createUser: body => req('/admin/users', { method: 'POST', body }),
    patchUser: (id, body) => req(`/admin/users/${id}`, { method: 'PATCH', body }),
    deleteUser: id => req(`/admin/users/${id}`, { method: 'DELETE' }),
    classes: () => req('/admin/classes'),
    createClass: body => req('/admin/classes', { method: 'POST', body }),
    enroll: (classId, body) => req(`/admin/classes/${classId}/enroll`, { method: 'POST', body })
  }
}
