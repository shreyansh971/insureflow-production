import React from 'react';
import { statusClass, statusLabel } from '../../utils/helpers';

export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : t.type === 'warning' ? '⚠ ' : '🔔 '}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusClass(status)}`}>{statusLabel(status)}</span>;
}
