const BASE = '/api'
export const getToken = () => localStorage.getItem('gt_token')
export const setToken = t => localStorage.setItem('gt_token', t)
export const clearToken = () => localStorage.removeItem('gt_token')

async function req(path, opts = {}) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // auth
  login: (email, password) => req('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => req('/auth/me'),

  // teacher
  teacher: {
    classes: () => req('/teacher/classes'),
    createClass: body => req('/teacher/classes', { method: 'POST', body }),
    classStudents: id => req(`/teacher/classes/${id}/students`),
    sessions: () => req('/teacher/sessions'),
    createSession: body => req('/teacher/sessions', { method: 'POST', body }),
    patchSession: (id, body) => req(`/teacher/sessions/${id}`, { method: 'PATCH', body }),
    addQuestion: (sessionId, body) => req(`/teacher/sessions/${sessionId}/questions`, { method: 'POST', body }),
    deleteQuestion: id => req(`/teacher/questions/${id}`, { method: 'DELETE' }),
    analytics: id => req(`/teacher/sessions/${id}/analytics`),
    live: id => req(`/teacher/sessions/${id}/live`),
    questionBank: () => req('/teacher/question-bank'),
    addToBank: body => req('/teacher/question-bank', { method: 'POST', body }),
  },

  // student
  student: {
    join: code => req(`/student/join/${code}`),
    state: id => req(`/student/session/${id}/state`),
    submit: (id, body) => req(`/student/session/${id}/submit`, { method: 'POST', body }),
    leaderboard: id => req(`/student/session/${id}/leaderboard`),
    chat: (id, qid) => req(`/student/session/${id}/chat/${qid}`),
    profile: () => req('/student/profile'),
  },

  // admin
  admin: {
    overview: () => req('/admin/overview'),
  }
}
