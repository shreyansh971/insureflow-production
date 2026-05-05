import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/* ── Request interceptor: attach JWT ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insureflow_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

/* ── Response interceptor: handle auth errors ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('insureflow_token');
      localStorage.removeItem('insureflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/* ════════════════ Auth ══════════════════════════════════ */
export const authAPI = {
  login:          (credentials)  => api.post('/auth/login',           credentials),
  register:       (data)         => api.post('/auth/register',         data),
  getMe:          ()             => api.get ('/auth/me'),
  updateMe:       (data)         => api.put ('/auth/me',               data),
  changePassword: (data)         => api.put ('/auth/change-password',  data),
};

/* ════════════════ Claims ════════════════════════════════ */
export const claimsAPI = {
  getAll:       (params)          => api.get  ('/claims',                   { params }),
  getById:      (id)              => api.get  (`/claims/${id}`),
  create:       (formData)        => api.post ('/claims',                   formData,
                                      { headers: { 'Content-Type': 'multipart/form-data' } }),
  approve:      (id, data)        => api.put  (`/claims/${id}/approve`,     data),
  reject:       (id, data)        => api.put  (`/claims/${id}/reject`,      data),
  setUnderReview: (id)            => api.put  (`/claims/${id}/under-review`),
  getStats:     ()                => api.get  ('/claims/stats'),
};

/* ════════════════ Hospitals ═════════════════════════════ */
export const hospitalsAPI = {
  getAll:  (params) => api.get('/hospitals',        { params }),
  getCities:       () => api.get('/hospitals/cities'),
};

/* ════════════════ Notifications ═════════════════════════ */
export const notificationsAPI = {
  getAll:    ()   => api.get('/notifications'),
  markRead:  (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/all/read'),
};

/* ════════════════ Reimbursements ════════════════════════ */
export const reimbursementsAPI = {
  getAll: () => api.get('/reimbursements'),
};

/* ════════════════ Admin ═════════════════════════════════ */
export const adminAPI = {
  getUsers:       (params) => api.get('/users',          { params }),
  getUserById:    (id)     => api.get(`/users/${id}`),
  updateStatus:   (id, status) => api.put(`/users/${id}/status`, { status }),
  getAuditLogs:   (params) => api.get('/audit-logs',     { params }),
  getAnalytics:   ()       => api.get('/analytics'),
};

export default api;
