import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectAllClaims, fetchClaims, approveClaimAsync, rejectClaimAsync } from '../features/claims/claimsSlice';
import { adminAPI, claimsAPI } from '../services/api';
import { StatusBadge } from '../components/common';
import { fmt, fmtDate } from '../utils/helpers';

// ─── APPROVE MODAL ────────────────────────────────────
function ApproveModal({ claim, onClose, onConfirm, loading }) {
  const [amount,  setAmount]  = useState(claim.amount);
  const [remarks, setRemarks] = useState('All documents verified. Policy coverage confirmed.');
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 style={{ fontSize: 20, marginBottom: 4 }}>Approve Claim</h3>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>{claim.id} · {claim.diagnosis}</p>
        <div style={{ background: 'var(--green-lt)', border: '1px solid #86efac', borderRadius: 'var(--r-sm)', padding: 12, fontSize: 13, marginBottom: 16 }}>
          Claimed Amount: <strong>{fmt(claim.amount)}</strong>
        </div>
        <div className="form-group">
          <label className="form-label">Approved Amount (₹) <span className="req">*</span></label>
          <input type="number" className="form-input" value={amount} style={{ fontFamily: 'DM Mono,monospace' }}
            onChange={(e) => setAmount(e.target.value)} />
          <div className="form-hint">You may approve a partial amount</div>
        </div>
        <div className="form-group">
          <label className="form-label">Adjudicator Remarks</label>
          <textarea className="form-textarea" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-success" disabled={loading} onClick={() => onConfirm(Number(amount), remarks)}>
            {loading ? 'Approving…' : '✓ Confirm Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REJECT MODAL ─────────────────────────────────────
function RejectModal({ claim, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 style={{ fontSize: 20, marginBottom: 4 }}>Reject Claim</h3>
        <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>{claim.id} · {claim.diagnosis}</p>
        <div style={{ background: 'var(--red-lt)', border: '1px solid #fca5a5', borderRadius: 'var(--r-sm)', padding: 12, fontSize: 13, marginBottom: 16 }}>
          This action will notify the policyholder and cannot be undone without admin override.
        </div>
        <div className="form-group">
          <label className="form-label">Rejection Reason <span className="req">*</span></label>
          <textarea className="form-textarea" value={reason} placeholder="State the reason clearly..."
            onChange={(e) => setReason(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" disabled={loading || !reason.trim()} onClick={() => onConfirm(reason)}>
            {loading ? 'Rejecting…' : '✕ Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────
export function AdminDashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const claims   = useSelector(selectAllClaims);
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dispatch(fetchClaims()),
      claimsAPI.getStats().then(({ data }) => setStats(data.stats)),
      adminAPI.getUsers().then(({ data }) => setUsers(data.users || [])),
    ]).finally(() => setLoading(false));
  }, [dispatch]);

  const total       = stats?.total       || claims.length;
  const pending     = stats?.pending     || claims.filter(c => c.status === 'pending').length;
  const underReview = stats?.underReview || claims.filter(c => c.status === 'under-review').length;
  const approved    = stats?.approved    || claims.filter(c => c.status === 'approved').length;
  const rejected    = stats?.rejected    || claims.filter(c => c.status === 'rejected').length;
  const totalPaid   = stats?.totalPaid   || 0;
  const conflicts   = claims.filter(c => c.conflict).length;
  const totalClaimed = claims.reduce((a, c) => a + (c.amount || 0), 0);
  const policyholders = users.filter(u => u.role === 'user').length;

  return (
    <>
      {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink3)', fontSize: 13 }}>Loading dashboard…</div>}

      <div className="stat-grid">
        {[
          { label: 'Total Claims',    value: total,           icon: '📋', accent: 'var(--accent)', bg: 'var(--accent-lt)', delta: 'All time' },
          { label: 'Awaiting Action', value: pending + underReview, icon: '⏳', accent: 'var(--amber)', bg: 'var(--amber-lt)', delta: `${pending} pending · ${underReview} reviewing` },
          { label: 'Approved',        value: approved,        icon: '✓',  accent: 'var(--green)',  bg: 'var(--green-lt)', delta: `${Math.round((approved / Math.max(total, 1)) * 100)}% approval rate` },
          { label: 'Flagged',         value: conflicts,       icon: '⚠️', accent: 'var(--red)',   bg: 'var(--red-lt)',   delta: 'Require manual review' },
        ].map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-accent" style={{ background: s.accent }} />
            <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-delta" style={{ color: s.accent }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📊 Claims by Status</div>
          {[['Pending', pending, 'var(--amber)'], ['Under Review', underReview, 'var(--purple)'], ['Approved', approved, 'var(--green)'], ['Rejected', rejected, 'var(--red)']].map(([l, v, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13.5 }}>{l}</div>
              <div style={{ fontWeight: 700, fontSize: 13.5, width: 24, textAlign: 'right' }}>{v}</div>
              <div style={{ width: 110, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: c, width: `${Math.round((v / Math.max(total, 1)) * 100)}%`, borderRadius: 3, transition: 'width .6s' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💰 Financial Summary</div>
          {[
            ['Total Amount Claimed',       fmt(totalClaimed),               'var(--ink)'],
            ['Total Approved & Disbursed', fmt(totalPaid),                  'var(--green)'],
            ['Avg. Claim Amount',          fmt(Math.round(totalClaimed / Math.max(total, 1))), 'var(--accent)'],
            ['Registered Policyholders',   `${policyholders} policyholders`, 'var(--purple)'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 20, fontFamily: 'Syne,sans-serif', fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-header">
        <div><div className="section-title">Pending Queue</div><div className="section-sub">Claims requiring your attention</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/queue')}>View Full Queue →</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Claim No.</th><th>Diagnosis</th><th>Amount</th><th>Conflict</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {claims.filter(c => c.status === 'pending' || c.status === 'under-review').slice(0, 5).map((c) => (
              <tr key={c.id}>
                <td><span className="claim-num">{c.id}</span></td>
                <td><div style={{ fontWeight: 500 }}>{c.diagnosis}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>{c.hospital?.split(',')[0]}</div></td>
                <td><strong>{fmt(c.amount)}</strong></td>
                <td>{c.conflict ? <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>⚠️ Exceeds</span> : <span style={{ color: 'var(--green)', fontSize: 12 }}>✓ Clear</span>}</td>
                <td><StatusBadge status={c.status} /></td>
                <td style={{ fontSize: 12, color: 'var(--ink3)' }}>{fmtDate(c.createdAt)}</td>
                <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/claims/${c.id}`)}>Review</button></td>
              </tr>
            ))}
            {claims.filter(c => c.status === 'pending' || c.status === 'under-review').length === 0 &&
              <tr><td colSpan={7}><div className="empty-state"><div className="es-icon">🎉</div><div className="es-title">All clear!</div></div></td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── CLAIM QUEUE ──────────────────────────────────────
export function ClaimQueuePage({ addToast }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const claims   = useSelector(selectAllClaims);
  const queue    = claims.filter(c => c.status === 'pending' || c.status === 'under-review');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget,  setRejectTarget]  = useState(null);
  const [modalLoading,  setModalLoading]  = useState(false);

  useEffect(() => { dispatch(fetchClaims()); }, [dispatch]);

  const handleApprove = async (amount, remarks) => {
    setModalLoading(true);
    const result = await dispatch(approveClaimAsync({ id: approveTarget.id, approvedAmount: amount, remarks }));
    setModalLoading(false);
    setApproveTarget(null);
    if (approveClaimAsync.fulfilled.match(result)) {
      if (addToast) addToast('Claim approved and saved to database!', 'success');
    } else {
      if (addToast) addToast(result.payload || 'Approval failed', 'error');
    }
  };

  const handleReject = async (reason) => {
    setModalLoading(true);
    const result = await dispatch(rejectClaimAsync({ id: rejectTarget.id, reason }));
    setModalLoading(false);
    setRejectTarget(null);
    if (rejectClaimAsync.fulfilled.match(result)) {
      if (addToast) addToast('Claim rejected and saved to database.', 'error');
    } else {
      if (addToast) addToast(result.payload || 'Rejection failed', 'error');
    }
  };

  return (
    <>
      {approveTarget && <ApproveModal claim={approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} loading={modalLoading} />}
      {rejectTarget  && <RejectModal  claim={rejectTarget}  onClose={() => setRejectTarget(null)}  onConfirm={handleReject}  loading={modalLoading} />}
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink3)' }}>
        {queue.length} claim{queue.length !== 1 ? 's' : ''} awaiting decision
      </div>
      {queue.length === 0 ? (
        <div className="empty-state"><div className="es-icon">🎉</div><div className="es-title">All clear!</div><div className="es-desc">No pending claims to review</div></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Claim No.</th><th>Diagnosis</th><th>Hospital</th><th>Amount</th><th>Conflict</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {queue.map((c) => (
                <tr key={c.id}>
                  <td><span className="claim-num">{c.id}</span></td>
                  <td><div style={{ fontWeight: 500 }}>{c.diagnosis}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>{c.icd}</div></td>
                  <td style={{ fontSize: 13 }}>{c.hospital?.split(',')[0]}</td>
                  <td><strong>{fmt(c.amount)}</strong></td>
                  <td>{c.conflict ? <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>⚠️ Exceeds</span> : <span style={{ color: 'var(--green)', fontSize: 12 }}>✓ Clear</span>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--ink3)' }}>{fmtDate(c.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/claims/${c.id}`)}>View</button>
                      <button className="btn btn-success btn-sm" onClick={() => setApproveTarget(c)}>Approve</button>
                      <button className="btn btn-danger btn-sm"  onClick={() => setRejectTarget(c)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── ALL CLAIMS ───────────────────────────────────────
export function AllClaimsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const claims   = useSelector(selectAllClaims);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { dispatch(fetchClaims()); }, [dispatch]);

  const filtered = claims.filter((c) => {
    const q = search.toLowerCase();
    return (!q || c.id?.toLowerCase().includes(q) || c.diagnosis?.toLowerCase().includes(q) || c.hospital?.toLowerCase().includes(q))
      && (statusFilter === 'all' || c.status === statusFilter);
  });

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 300 }}
          placeholder="🔍  Search by claim no., diagnosis, hospital..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="under-review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{filtered.length} of {claims.length} records</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Claim No.</th><th>Diagnosis</th><th>Hospital</th><th>Claimed</th><th>Approved</th><th>Conflict</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={9}><div className="empty-state"><div className="es-icon">🔍</div><div className="es-title">No results</div></div></td></tr>
              : filtered.map((c) => (
                <tr key={c.id}>
                  <td><span className="claim-num">{c.id}</span></td>
                  <td><div style={{ fontWeight: 500 }}>{c.diagnosis}</div><div style={{ fontSize: 11, color: 'var(--ink3)' }}>{c.icd}</div></td>
                  <td style={{ fontSize: 13 }}>{c.hospital?.split(',')[0]}</td>
                  <td><strong>{fmt(c.amount)}</strong></td>
                  <td style={{ color: c.approved ? 'var(--green)' : 'var(--ink3)' }}>{c.approved ? fmt(c.approved) : '—'}</td>
                  <td>{c.conflict ? <span style={{ color: 'var(--red)', fontSize: 12, fontWeight: 600 }}>⚠️ Yes</span> : <span style={{ color: 'var(--green)', fontSize: 12 }}>✓ No</span>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--ink3)' }}>{fmtDate(c.createdAt)}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/claims/${c.id}`)}>View</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── MANAGE USERS ─────────────────────────────────────
export function ManageUsersPage({ addToast }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewUser,   setViewUser]   = useState(null);

  useEffect(() => {
    adminAPI.getUsers()
      .then(({ data }) => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (!q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
      && (roleFilter === 'all' || u.role === roleFilter);
  });

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await adminAPI.updateStatus(id, newStatus);
      setUsers(p => p.map(u => u._id === id ? { ...u, status: newStatus } : u));
      if (addToast) addToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`, 'success');
    } catch {
      if (addToast) addToast('Failed to update user status', 'error');
    }
  };

  return (
    <>
      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, marginBottom: 4 }}>User Profile</h3>
            <p style={{ fontSize: 13, color: 'var(--ink3)', marginBottom: 20 }}>{viewUser.role === 'admin' ? 'Administrator' : 'Policyholder'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13.5 }}>
              {[
                ['Name', viewUser.name], ['Email', viewUser.email], ['Phone', viewUser.phone || '—'],
                ['Role', viewUser.role], ['Status', viewUser.status], ['Joined', fmtDate(viewUser.createdAt || viewUser.joined)],
                ['Policy ID', viewUser.policy?.id || '—'], ['Claims Filed', viewUser.claims ?? '—'],
              ].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.05em' }}>{l}</div><div style={{ fontWeight: 500 }}>{String(v)}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setViewUser(null)}>Close</button>
              <button className={`btn ${viewUser.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                onClick={() => { toggleStatus(viewUser._id, viewUser.status); setViewUser(null); }}>
                {viewUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 280 }}
          placeholder="🔍  Search name or email..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 150 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="user">Policyholders</option>
          <option value="admin">Admins</option>
        </select>
        <span style={{ fontSize: 13, color: 'var(--ink3)' }}>{filtered.length} users</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink3)' }}>Loading users…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Policy ID</th><th>Claims</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className={`avatar ${u.role === 'admin' ? 'admin' : ''}`} style={{ width: 28, height: 28, fontSize: 11, flexShrink: 0 }}>
                        {u.initials || u.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontSize: 13, fontFamily: 'DM Mono,monospace' }}>{u.phone || '—'}</td>
                  <td>
                    <span style={{ fontSize: 11.5, background: u.role === 'admin' ? 'var(--purple-lt)' : 'var(--accent-lt)', color: u.role === 'admin' ? 'var(--purple)' : 'var(--accent)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                      {u.role}
                    </span>
                  </td>
                  <td><span className="claim-num">{u.policy?.id || '—'}</span></td>
                  <td style={{ textAlign: 'center', fontFamily: 'DM Mono,monospace' }}>{u.claims ?? 0}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewUser(u)}>View</button>
                      <button className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(u._id, u.status)}>
                        {u.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="es-icon">👥</div><div className="es-title">No users found</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── ANALYTICS ────────────────────────────────────────
export function AnalyticsPage() {
  const dispatch = useDispatch();
  const claims   = useSelector(selectAllClaims);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    dispatch(fetchClaims());
    adminAPI.getAnalytics()
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(console.error);
  }, [dispatch]);

  const total        = claims.length;
  const approved     = claims.filter(c => c.status === 'approved').length;
  const rejected     = claims.filter(c => c.status === 'rejected').length;
  const pending      = claims.filter(c => c.status === 'pending' || c.status === 'under-review').length;
  const totalPaid    = claims.filter(c => c.approved).reduce((a, c) => a + c.approved, 0);
  const totalClaimed = claims.reduce((a, c) => a + (c.amount || 0), 0);
  const approvalRate = Math.round((approved / Math.max(total, 1)) * 100);

  const diagCounts = {};
  claims.forEach(c => { if (c.diagnosis) diagCounts[c.diagnosis] = (diagCounts[c.diagnosis] || 0) + 1; });
  const topDiag = Object.entries(diagCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // monthly bars from live analytics or fallback to claims array
  const monthlyBars = useMemo(() => {
    if (analytics?.claimsByMonth?.length) {
      return analytics.claimsByMonth.map(m => ({
        label: new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' }),
        count: m.count,
      }));
    }
    const months = {};
    claims.forEach(c => {
      const d = new Date(c.createdAt);
      if (!isNaN(d)) {
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        months[key] = (months[key] || 0) + 1;
      }
    });
    return Object.entries(months).slice(-6).map(([label, count]) => ({ label, count }));
  }, [analytics, claims]);

  const maxBar = Math.max(...monthlyBars.map(m => m.count), 1);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Approval Rate',  value: `${approvalRate}%`,                                          color: 'var(--green)',  icon: '✓' },
          { label: 'Rejection Rate', value: `${Math.round((rejected / Math.max(total, 1)) * 100)}%`,    color: 'var(--red)',    icon: '✕' },
          { label: 'Pending Rate',   value: `${Math.round((pending  / Math.max(total, 1)) * 100)}%`,    color: 'var(--amber)', icon: '⏳' },
          { label: 'Total Disbursed',value: fmt(totalPaid),                                              color: 'var(--accent)', icon: '💰' },
        ].map((k) => (
          <div key={k.label} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--surface2)', fontSize: 20 }}>{k.icon}</div>
            <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>📅 Monthly Claims</div>
          {monthlyBars.length === 0
            ? <div style={{ color: 'var(--ink3)', fontSize: 13 }}>No data yet — submit claims to see trends.</div>
            : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                {monthlyBars.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--ink3)', fontFamily: 'DM Mono,monospace' }}>{m.count}</div>
                    <div style={{ width: '100%', background: 'var(--accent)', borderRadius: '4px 4px 0 0', height: `${Math.round((m.count / maxBar) * 90)}px`, transition: 'height .5s ease', opacity: i === monthlyBars.length - 1 ? 1 : 0.6 }} />
                    <div style={{ fontSize: 10, color: 'var(--ink3)' }}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>💰 Financial Metrics</div>
          {[
            ['Total Claimed',    fmt(totalClaimed), 'var(--ink)',   100],
            ['Total Disbursed',  fmt(totalPaid),    'var(--green)', Math.round((totalPaid / Math.max(totalClaimed, 1)) * 100)],
            ['Pending Exposure', fmt(claims.filter(c => c.status === 'pending' || c.status === 'under-review').reduce((a, c) => a + (c.amount || 0), 0)), 'var(--amber)', Math.round((pending / Math.max(total, 1)) * 100)],
          ].map(([l, v, c, pct]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12.5, color: 'var(--ink3)' }}>{l}</span>
                <span style={{ fontWeight: 700, color: c }}>{v}</span>
              </div>
              <div className="progress-bar-dark">
                <div className="progress-fill-dark" style={{ width: `${pct}%`, background: c }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🏥 Top Diagnoses</div>
        {topDiag.length === 0
          ? <div style={{ color: 'var(--ink3)', fontSize: 13 }}>No diagnosis data yet.</div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {topDiag.map(([diag, count]) => (
                <div key={diag} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏥</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{diag}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 2 }}>{count} claim{count > 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>{count}</div>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}

// ─── AUDIT LOGS ───────────────────────────────────────
const LOG_COLORS = {
  CLAIM_APPROVED: 'var(--green)', CLAIM_REJECTED: 'var(--red)', CLAIM_SUBMITTED: 'var(--accent)',
  CLAIM_UNDER_REVIEW: 'var(--amber)', USER_DEACTIVATED: 'var(--red)',
};

export function AuditLogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    adminAPI.getAuditLogs()
      .then(({ data }) => setLogs(data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.adminName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <input className="form-input" style={{ maxWidth: 300 }}
          placeholder="🔍  Filter by action or admin..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink3)' }}>Loading audit logs…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Action</th><th>Performed By</th><th>Resource</th><th>Details</th><th>Timestamp</th><th>IP</th></tr></thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="es-icon">📋</div><div className="es-title">No audit logs yet</div><div className="es-desc">Admin actions (approve/reject) will appear here</div></div></td></tr>
              )}
              {filtered.map((l) => (
                <tr key={l._id}>
                  <td><span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11.5, fontWeight: 600, color: LOG_COLORS[l.action] || 'var(--ink2)' }}>{l.action}</span></td>
                  <td style={{ fontSize: 13.5 }}>{l.adminName}</td>
                  <td><span className="claim-num">{l.entityId || '—'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--ink3)' }}>{l.details || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'DM Mono,monospace' }}>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink3)', fontFamily: 'DM Mono,monospace' }}>{l.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
