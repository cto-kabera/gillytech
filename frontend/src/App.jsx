import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

import LoginPage from './pages/LoginPage'
import TeacherLayout from './pages/teacher/Layout'
import TeacherDashboard from './pages/teacher/Dashboard'
import NewSession from './pages/teacher/NewSession'
import LiveMonitor from './pages/teacher/LiveMonitor'
import Analytics from './pages/teacher/Analytics'
import { SessionsList, ClassesList } from './pages/teacher/SessionsAndClasses'
import QuestionBank from './pages/teacher/QuestionBank'
import { StudentLayout, StudentHome } from './pages/student/StudentHome'
import StudentSession from './pages/student/StudentSession'
import StudentProfile from './pages/student/Profile'
import { AdminLayout, AdminDashboard } from './pages/admin/Admin'
import { AdminUsers, AdminSubjects, AdminClasses } from './pages/admin/Manage'

function Guard({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Teacher */}
          <Route path="/teacher" element={<Guard role="teacher"><TeacherLayout /></Guard>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="sessions" element={<SessionsList />} />
            <Route path="sessions/new" element={<NewSession />} />
            <Route path="sessions/:id/live" element={<LiveMonitor />} />
            <Route path="sessions/:id/analytics" element={<Analytics />} />
            <Route path="classes" element={<ClassesList />} />
            <Route path="question-bank" element={<QuestionBank />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<Guard role="student"><StudentLayout /></Guard>}>
            <Route index element={<StudentHome />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          <Route path="/student/session/:id" element={<Guard role="student"><StudentSession /></Guard>} />

          {/* Admin */}
          <Route path="/admin" element={<Guard role="admin"><AdminLayout /></Guard>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="classes" element={<AdminClasses />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
