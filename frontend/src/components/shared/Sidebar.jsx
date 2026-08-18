import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const AVATAR_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2','#be185d','#0f766e']
function avatarColor(name = '') { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length] }

export default function Sidebar({ items }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>⚗</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)', lineHeight: 1.2 }}>Gillytech</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0' }}>
        {items.map(item => (
          <button
            key={item.path}
            className={`nav-item ${pathname === item.path || pathname.startsWith(item.path + '/') ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--gray-100)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: 'var(--radius)' }}>
          <div className="avatar avatar-sm" style={{ background: avatarColor(user?.name), flexShrink: 0 }}>
            {user?.avatar || user?.name?.slice(0,2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={logout} title="Sign out" style={{ flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>→</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
