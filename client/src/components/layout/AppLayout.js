import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { selectUser } from '../../features/auth/authSlice';

const TITLES = {
  '/dashboard':           { title: 'Dashboard',           sub: 'Overview of your health insurance activity' },
  '/my-claims':           { title: 'My Claims',           sub: 'Track all your submitted claims' },
  '/new-claim':           { title: 'File New Claim',      sub: 'Submit a new reimbursement request' },
  '/hospitals':           { title: 'Hospital Network',    sub: 'Find cashless hospitals near you' },
  '/reimbursements':      { title: 'Reimbursements',      sub: 'Payment history and settlement records' },
  '/notifications':       { title: 'Notifications',       sub: 'Updates and alerts on your account' },
  '/profile':             { title: 'Profile & Settings',  sub: 'Manage your account and policy information' },
  '/admin/dashboard':     { title: 'Admin Dashboard',     sub: 'Platform health and key metrics' },
  '/admin/queue':         { title: 'Claim Queue',         sub: 'Review and adjudicate pending claims' },
  '/admin/all-claims':    { title: 'All Claims',          sub: 'Complete claims registry' },
  '/admin/users':         { title: 'Manage Users',        sub: 'All registered policyholders and admins' },
  '/admin/analytics':     { title: 'Analytics',           sub: 'Platform statistics and trends' },
  '/admin/audit-logs':    { title: 'Audit Logs',          sub: 'System activity and change log' },
};

export default function AppLayout({ addToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user     = useSelector(selectUser);
  const isAdmin  = user?.role === 'admin';
  const info     = TITLES[location.pathname] || { title: 'InsureFlow', sub: '' };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div>
            <div className="topbar-title">{info.title}</div>
            <div className="topbar-sub">{info.sub}</div>
          </div>
          <div className="topbar-actions">
            <button className="notif-btn" onClick={() => navigate('/notifications')}>
              🔔<span className="notif-dot" />
            </button>
            {!isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-claim')}>
                + File Claim
              </button>
            )}
          </div>
        </div>
        <div className="page-body page-enter">
          <Outlet context={{ addToast }} />
        </div>
      </div>
    </div>
  );
}
