import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, updateProfileAsync, changePasswordAsync } from '../features/auth/authSlice';
import { selectUserClaims, fetchClaims } from '../features/claims/claimsSlice';
import { reimbursementsAPI, notificationsAPI } from '../services/api';
import { StatusBadge } from '../components/common';
import { fmt, fmtDate } from '../utils/helpers';

// ─── REIMBURSEMENTS ───────────────────────────────────
export function ReimbursementsPage({ addToast }) {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const claims   = useSelector(selectUserClaims(user?._id || user?.id));
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchClaims());
    reimbursementsAPI.getAll()
      .then(({ data }) => setReimbursements(data.reimbursements || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dispatch]);

  const approvedClaims = claims.filter((c) => c.status === 'approved');
  const totalPaid      = approvedClaims.reduce((a, c) => a + (c.approved || 0), 0);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Reimbursed', value: fmt(totalPaid),              color: 'var(--green)',  icon: '💰' },
          { label: 'Approved Claims',  value: approvedClaims.length,       color: 'var(--accent)', icon: '✓'  },
          { label: 'Avg. Settlement',  value: approvedClaims.length ? fmt(Math.round(totalPaid / approvedClaims.length)) : '—', color: 'var(--purple)', icon: '📊' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--surface2)', fontSize: 22 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div><div className="section-title">Payment History</div><div className="section-sub">Settled claims and NEFT credit records</div></div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink3)' }}>Loading…</div>
      ) : reimbursements.length === 0 ? (
        <div className="empty-state"><div className="es-icon">💳</div><div className="es-title">No reimbursements yet</div><div className="es-desc">Approved claims will appear here once settled</div></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Ref No.</th><th>Claim ID</th><th>Amount</th><th>Method</th><th>Bank / Account</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {reimbursements.map((r) => (
                <tr key={r._id}>
                  <td><span className="claim-num">{r.ref || '—'}</span></td>
                  <td><span className="claim-num">{r.claimId?.claimNumber || r.claimId}</span></td>
                  <td><strong style={{ color: 'var(--green)' }}>{fmt(r.amount)}</strong></td>
                  <td style={{ fontSize: 13 }}>{r.method}</td>
                  <td style={{ fontSize: 13 }}>{r.bank ? `${r.bank} · ${r.account}` : '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink3)' }}>{fmtDate(r.createdAt)}</td>
                  <td>
                    <span style={{ background: r.status === 'credited' ? 'var(--green-lt)' : 'var(--amber-lt)', color: r.status === 'credited' ? 'var(--green)' : 'var(--amber)', padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>
                      {r.status === 'credited' ? '✓ Credited' : '⏳ Processing'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <div className="section-header"><div><div className="section-title">Approved Claims</div><div className="section-sub">All claims eligible for reimbursement</div></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Claim No.</th><th>Diagnosis</th><th>Claimed</th><th>Approved</th><th>Settlement Date</th></tr></thead>
            <tbody>
              {approvedClaims.length === 0
                ? <tr><td colSpan={5}><div className="empty-state"><div className="es-icon">📭</div><div className="es-title">No approved claims</div></div></td></tr>
                : approvedClaims.map((c) => (
                  <tr key={c.id}>
                    <td><span className="claim-num">{c.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{c.diagnosis}</td>
                    <td>{fmt(c.amount)}</td>
                    <td><strong style={{ color: 'var(--green)' }}>{fmt(c.approved)}</strong></td>
                    <td style={{ fontSize: 12, color: 'var(--ink3)' }}>{fmtDate(c.settledAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── PROFILE & SETTINGS ───────────────────────────────
export function ProfilePage({ addToast }) {
  const user     = useSelector(selectUser);
  const dispatch = useDispatch();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [tab, setTab]         = useState('profile');
  const [form, setForm]       = useState({
    name: user?.name || '', phone: user?.phone || '',
    address: user?.address || '', dob: user?.dob || '', gender: user?.gender || '',
  });
  const [pwForm, setPwForm]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await dispatch(updateProfileAsync(form));
    setSaving(false);
    if (updateProfileAsync.fulfilled.match(result)) {
      setEditing(false);
      if (addToast) addToast('Profile updated successfully!', 'success');
    } else {
      if (addToast) addToast(result.payload || 'Update failed', 'error');
    }
  };

  const handlePasswordChange = async () => {
    const e = {};
    if (!pwForm.currentPassword)              e.current = 'Enter your current password';
    if (pwForm.newPassword.length < 6)        e.newPw   = 'Min 6 characters';
    if (pwForm.newPassword !== pwForm.confirmPassword) e.confirm = 'Passwords do not match';
    setPwErrors(e);
    if (Object.keys(e).length) return;

    setPwSaving(true);
    const result = await dispatch(changePasswordAsync({
      currentPassword: pwForm.currentPassword,
      newPassword:     pwForm.newPassword,
    }));
    setPwSaving(false);
    if (changePasswordAsync.fulfilled.match(result)) {
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      if (addToast) addToast('Password changed successfully!', 'success');
    } else {
      if (addToast) addToast(result.payload || 'Password change failed', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="tabs">
        {['profile', 'policy', 'security'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === 'profile' && (
        <div className="card card-lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className={`avatar lg ${user.role === 'admin' ? 'admin' : ''}`}>{user.initials}</div>
            <div>
              <h2 style={{ fontSize: 22 }}>{user.name}</h2>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{user.email} · {user.role === 'admin' ? 'Adjudicator / Admin' : 'Policyholder'}</div>
            </div>
            {!editing && <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}>Edit Profile</button>}
          </div>
          {editing ? (
            <>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}/></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}/></div>
              <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}/></div>
              {user.role !== 'admin' && (
                <>
                  <div className="form-group"><label className="form-label">Date of Birth</label><input type="date" className="form-input" value={form.dob} onChange={(e) => setForm(p => ({ ...p, dob: e.target.value }))}/></div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender} onChange={(e) => setForm(p => ({ ...p, gender: e.target.value }))}>
                      <option value="">Select</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Full Name', user.name], ['Email', user.email], ['Phone', user.phone || '—'],
                user.role !== 'admin' && ['Date of Birth', user.dob ? fmtDate(user.dob) : '—'],
                user.role !== 'admin' && ['Gender', user.gender || '—'],
                ['Address', user.address || '—'],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{l}</div>
                  <div style={{ fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Policy tab ── */}
      {tab === 'policy' && user.role !== 'admin' && user.policy && (
        <div className="card card-lg">
          <h3 style={{ marginBottom: 20 }}>Policy Information</h3>
          <div className="policy-card" style={{ marginBottom: 0 }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Policy ID</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{user.policy.id}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginBottom: 20 }}>{user.policy.provider} · {user.policy.type}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
                {[['Coverage Limit', fmt(user.policy.coverageLimit)], ['Remaining Balance', fmt(user.policy.remaining)], ['Annual Premium', fmt(user.policy.premium)], ['Valid From', fmtDate(user.policy.validFrom)], ['Valid Until', fmtDate(user.policy.validUntil)]].map(([l, v]) => (
                  <div key={l}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 3 }}>{l}</div><div style={{ fontWeight: 700 }}>{v}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === 'policy' && user.role === 'admin' && (
        <div className="card card-lg"><div className="empty-state"><div className="es-icon">🛡️</div><div className="es-title">Admin account</div><div className="es-desc">No policy linked to admin accounts</div></div></div>
      )}

      {/* ── Security tab ── */}
      {tab === 'security' && (
        <div className="card card-lg">
          <h3 style={{ marginBottom: 20 }}>Change Password</h3>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className={`form-input ${pwErrors.current ? 'error' : ''}`} placeholder="••••••••"
              value={pwForm.currentPassword} onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} />
            {pwErrors.current && <div className="form-error">{pwErrors.current}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className={`form-input ${pwErrors.newPw ? 'error' : ''}`} placeholder="Min 6 characters"
              value={pwForm.newPassword} onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))} />
            {pwErrors.newPw && <div className="form-error">{pwErrors.newPw}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className={`form-input ${pwErrors.confirm ? 'error' : ''}`} placeholder="Repeat new password"
              value={pwForm.confirmPassword} onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} />
            {pwErrors.confirm && <div className="form-error">{pwErrors.confirm}</div>}
          </div>
          <button className="btn btn-primary btn-sm" onClick={handlePasswordChange} disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────
export function NotificationsPage() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI.getAll()
      .then(({ data }) => setNotifs(data.notifications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = async (id) => {
    setNotifs((p) => p.map((n) => n._id === id ? { ...n, read: true } : n));
    await notificationsAPI.markRead(id).catch(console.error);
  };

  const markAllRead = async () => {
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
    await notificationsAPI.markAllRead().catch(console.error);
  };

  const ICON = { success: '✓', info: 'ℹ', warning: '⚠', error: '✕' };
  const BG   = { success: 'var(--green-lt)', info: 'var(--accent-lt)', warning: 'var(--amber-lt)', error: 'var(--red-lt)' };
  const CLR  = { success: 'var(--green)',    info: 'var(--accent)',    warning: 'var(--amber)',    error: 'var(--red)' };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--ink3)' }}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</div>
        {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink3)' }}>Loading…</div>}

      {!loading && notifs.length === 0 && (
        <div className="empty-state"><div className="es-icon">🔔</div><div className="es-title">No notifications</div><div className="es-desc">You're all caught up!</div></div>
      )}

      {notifs.map((n) => (
        <div key={n._id} onClick={() => !n.read && markRead(n._id)}
          style={{ display: 'flex', gap: 14, padding: 16, background: 'var(--surface)',
            border: `1px solid ${n.read ? 'var(--border)' : CLR[n.type]}`,
            borderRadius: 'var(--r-md)', marginBottom: 10, cursor: n.read ? 'default' : 'pointer',
            opacity: n.read ? 0.8 : 1, transition: 'all .15s' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: BG[n.type], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: CLR[n.type], fontWeight: 700, flexShrink: 0 }}>
            {ICON[n.type]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 14 }}>{n.title}</div>
            <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 2 }}>{n.msg}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink3)', whiteSpace: 'nowrap' }}>
              {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </div>
            {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: CLR[n.type] }} />}
          </div>
        </div>
      ))}
    </div>
  );
}
