import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUser } from './features/auth/authSlice';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/common';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HospitalsPage from './pages/HospitalsPage';

import {
  MyClaimsPage,
  ClaimDetailPage,
  NewClaimPage,
} from './pages/ClaimsPages';

import {
  ReimbursementsPage,
  ProfilePage,
  NotificationsPage,
} from './pages/OtherPages';

import {
  AdminDashboardPage,
  ClaimQueuePage,
  AllClaimsPage,
  ManageUsersPage,
  AnalyticsPage,
  AuditLogsPage,
} from './pages/AdminPages';

/* ── Guards ── */
function RequireAuth({ children }) {
  const isAuth = useSelector(selectIsAuthenticated);
  return isAuth ? children : <Navigate to="/login" replace />;
}
function RequireUser({ children }) {
  const user = useSelector(selectUser);
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'user' ? children : <Navigate to="/admin/dashboard" replace />;
}
function RequireAdmin({ children }) {
  const user = useSelector(selectUser);
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}
function RootRedirect() {
  const isAuth = useSelector(selectIsAuthenticated);
  const user   = useSelector(selectUser);
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
}

export default function App() {
  const { toasts, addToast } = useToast();

  return (
    <BrowserRouter>
      <ToastContainer toasts={toasts} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage addToast={addToast} />} />
        <Route path="/"      element={<RootRedirect />} />

        {/* Policyholder */}
        <Route element={
          <RequireAuth><RequireUser>
            <AppLayout addToast={addToast} />
          </RequireUser></RequireAuth>
        }>
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/my-claims"      element={<MyClaimsPage />} />
          <Route path="/my-claims/:id"  element={<ClaimDetailPage />} />
          <Route path="/new-claim"      element={<NewClaimPage />} />
          <Route path="/hospitals"      element={<HospitalsPage />} />
          <Route path="/reimbursements" element={<ReimbursementsPage addToast={addToast} />} />
          <Route path="/notifications"  element={<NotificationsPage />} />
          <Route path="/profile"        element={<ProfilePage addToast={addToast} />} />
        </Route>

        {/* Admin */}
        <Route element={
          <RequireAuth><RequireAdmin>
            <AppLayout addToast={addToast} />
          </RequireAdmin></RequireAuth>
        }>
          <Route path="/admin/dashboard"  element={<AdminDashboardPage />} />
          <Route path="/admin/queue"      element={<ClaimQueuePage addToast={addToast} />} />
          <Route path="/admin/all-claims" element={<AllClaimsPage />} />
          <Route path="/admin/claims/:id" element={<ClaimDetailPage />} />
          <Route path="/admin/users"      element={<ManageUsersPage addToast={addToast} />} />
          <Route path="/admin/analytics"  element={<AnalyticsPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/profile"          element={<ProfilePage addToast={addToast} />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
