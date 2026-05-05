export const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const statusClass = (s) => ({
  pending: 'badge-pending', 'under-review': 'badge-review',
  approved: 'badge-approved', rejected: 'badge-rejected',
  active: 'badge-active', inactive: 'badge-inactive',
}[s] || 'badge-pending');
export const statusLabel = (s) => ({
  pending: 'Pending', 'under-review': 'Under Review',
  approved: 'Approved', rejected: 'Rejected',
  active: 'Active', inactive: 'Inactive',
}[s] || s);
export const genClaimId = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `CLM-${d}-${Math.floor(10000 + Math.random() * 90000)}`;
};
export const pctColor = (pct) => {
  if (pct >= 90) return 'var(--green)';
  if (pct >= 70) return 'var(--accent)';
  if (pct >= 50) return 'var(--amber)';
  return 'var(--red)';
};
