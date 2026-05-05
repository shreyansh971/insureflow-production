import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectUser } from '../features/auth/authSlice';
import { selectUserClaims, fetchClaims } from '../features/claims/claimsSlice';
import { StatusBadge } from '../components/common';
import { fmt, fmtDate } from '../utils/helpers';

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const claims   = useSelector(selectUserClaims(user?.id || user?._id));

  useEffect(() => { dispatch(fetchClaims()); }, [dispatch]);

  const totalFiled    = claims.length;
  const totalApproved = claims.filter((c) => c.status === 'approved').length;
  const totalPaid     = claims.filter((c) => c.approved).reduce((a, c) => a + c.approved, 0);
  const pending       = claims.filter((c) => c.status === 'pending' || c.status === 'under-review').length;
  const used          = user.policy.coverageLimit - user.policy.remaining;
  const usedPct       = Math.round((used / user.policy.coverageLimit) * 100);

  return (
    <>
      <div className="policy-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Active Policy</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{user.policy.id}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>{user.policy.provider} · {user.policy.type} · Valid till {fmtDate(user.policy.validUntil)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Remaining Balance</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800 }}>{fmt(user.policy.remaining)}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 20, position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Coverage Limit', val: fmt(user.policy.coverageLimit) },
            { label: 'Amount Used',    val: fmt(used), bar: true },
            { label: 'Utilization',    val: `${usedPct}%` },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{item.val}</div>
              {item.bar && <div className="progress-bar"><div className="progress-fill" style={{ width: `${usedPct}%` }} /></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        {[
          { label: 'Claims Filed',     value: totalFiled,       icon: '📋', accent: 'var(--accent)',  bg: 'var(--accent-lt)',  delta: 'All time' },
          { label: 'Claims Approved',  value: totalApproved,    icon: '✓',  accent: 'var(--green)',   bg: 'var(--green-lt)',   delta: `${Math.round((totalApproved/Math.max(totalFiled,1))*100)}% success` },
          { label: 'Awaiting Decision',value: pending,          icon: '⏳', accent: 'var(--amber)',   bg: 'var(--amber-lt)',   delta: 'In progress' },
          { label: 'Total Reimbursed', value: fmt(totalPaid),   icon: '₹',  accent: 'var(--purple)',  bg: 'var(--purple-lt)',  delta: 'Settled' },
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

      <div className="section-header">
        <div><div className="section-title">Quick Actions</div></div>
      </div>
      <div className="quick-actions">
        {[
          { icon: '📝', title: 'File New Claim',   sub: 'Submit reimbursement',    path: '/new-claim' },
          { icon: '🏥', title: 'Find Hospital',    sub: 'Cashless network search', path: '/hospitals' },
          { icon: '💳', title: 'Reimbursements',  sub: 'Payment history',         path: '/reimbursements' },
        ].map((qa) => (
          <div className="qa-card" key={qa.title} onClick={() => navigate(qa.path)}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{qa.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{qa.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink3)', marginTop: 2 }}>{qa.sub}</div>
          </div>
        ))}
      </div>

      <div className="section-header" style={{ marginTop: 8 }}>
        <div><div className="section-title">Recent Claims</div><div className="section-sub">Your latest submissions</div></div>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/my-claims')}>View All →</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Claim No.</th><th>Diagnosis</th><th>Hospital</th><th>Amount</th><th>Status</th><th>Date</th><th></th></tr></thead>
          <tbody>
            {claims.slice(0, 3).map((c) => (
              <tr key={c.id}>
                <td><span className="claim-num">{c.id}</span></td>
                <td><span style={{ fontWeight: 500 }}>{c.diagnosis}</span></td>
                <td style={{ color: 'var(--ink2)', fontSize: 13 }}>{c.hospital.split(',')[0]}</td>
                <td><strong>{fmt(c.amount)}</strong></td>
                <td><StatusBadge status={c.status} /></td>
                <td style={{ color: 'var(--ink3)', fontSize: 12 }}>{fmtDate(c.created)}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/my-claims/${c.id}`)}>View →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
