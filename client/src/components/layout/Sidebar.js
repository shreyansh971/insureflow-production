import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../features/auth/authSlice';
import { selectPendingCount } from '../../features/claims/claimsSlice';

const USER_NAV = [
  { path: '/dashboard',         icon: '⊞', label: 'Dashboard' },
  { path: '/my-claims',         icon: '📋', label: 'My Claims' },
  { path: '/new-claim',         icon: '+',  label: 'File a Claim' },
  { path: '/hospitals',         icon: '🏥', label: 'Hospital Network' },
  { path: '/reimbursements',    icon: '💳', label: 'Reimbursements' },
  { path: '/notifications',     icon: '🔔', label: 'Notifications' },
];
const ADMIN_NAV = [
  { path: '/admin/dashboard',   icon: '⊞', label: 'Admin Dashboard' },
  { path: '/admin/queue',       icon: '📥', label: 'Claim Queue', badge: true },
  { path: '/admin/all-claims',  icon: '📊', label: 'All Claims' },
  { path: '/admin/users',       icon: '👥', label: 'Manage Users' },
  { path: '/admin/analytics',   icon: '📈', label: 'Analytics' },
  { path: '/admin/audit-logs',  icon: '🔍', label: 'Audit Logs' },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const user      = useSelector(selectUser);
  const pending   = useSelector(selectPendingCount);
  const isAdmin   = user?.role === 'admin';
  const navItems  = isAdmin ? ADMIN_NAV : USER_NAV;

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🏥</div>
          <div>
            <div className="logo-text">Insure<span>Flow</span></div>
            <div className="logo-sub">Claims Platform v2.0</div>
          </div>
        </div>
      </div>
      <div className="sidebar-nav">
        <div className="nav-section-label">{isAdmin ? 'Admin' : 'Policyholder'}</div>
        {navItems.map((n) => (
          <button key={n.path} className={`nav-item ${location.pathname === n.path ? 'active' : ''}`}
            onClick={() => navigate(n.path)}>
            <span className="ni">{n.icon}</span>
            {n.label}
            {n.badge && pending > 0 && <span className="nav-badge">{pending}</span>}
          </button>
        ))}
        <div className="nav-section-label" style={{ marginTop: 16 }}>Account</div>
        <button className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}>
          <span className="ni">⚙</span> Profile & Settings
        </button>
        <button className="nav-item" onClick={() => dispatch(logout())}>
          <span className="ni">↩</span> Sign Out
        </button>
      </div>
      <div className="sidebar-user">
        <div className={`avatar ${isAdmin ? 'admin' : ''}`}>{user?.initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{isAdmin ? 'Adjudicator' : 'Policyholder'}</div>
        </div>
      </div>
    </nav>
  );
}
