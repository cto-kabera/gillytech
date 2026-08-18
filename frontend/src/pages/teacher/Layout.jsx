import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'

const NAV = [
  { path: '/teacher',                  icon: '🏠', label: 'Dashboard' },
  { path: '/teacher/sessions',         icon: '📋', label: 'Sessions' },
  { path: '/teacher/sessions/new',     icon: '➕', label: 'New session' },
  { path: '/teacher/classes',          icon: '🏫', label: 'Classes' },
  { path: '/teacher/question-bank',    icon: '📚', label: 'Question bank' },
]

export default function TeacherLayout() {
  return (
    <div className="app-layout">
      <Sidebar items={NAV} />
      <main className="main-content"><Outlet /></main>
    </div>
  )
}
