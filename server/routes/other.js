const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/otherControllers');
const { protect, adminOnly } = require('../middleware/auth');

/* ── Users ── */
router.get('/users',              protect, adminOnly, ctrl.getAllUsers);
router.get('/users/:id',          protect, adminOnly, ctrl.getUserById);
router.put('/users/:id/status',   protect, adminOnly, ctrl.updateUserStatus);

/* ── Hospitals ── */
router.get('/hospitals',          protect, ctrl.getHospitals);
router.get('/hospitals/cities',   protect, ctrl.getCities);

/* ── Notifications ── */
router.get('/notifications',             protect, ctrl.getNotifications);
router.put('/notifications/:id/read',    protect, ctrl.markRead);

/* ── Reimbursements ── */
router.get('/reimbursements',     protect, ctrl.getReimbursements);

/* ── Audit logs ── */
router.get('/audit-logs',         protect, adminOnly, ctrl.getAuditLogs);

/* ── Analytics ── */
router.get('/analytics',          protect, adminOnly, ctrl.getAnalytics);

module.exports = router;
