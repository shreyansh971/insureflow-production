const User         = require('../models/User');
const { Hospital, Notification, AuditLog, Reimbursement } = require('../models/index');
const Claim        = require('../models/Claim');

/* ════════════════ USERS (admin) ═══════════════════════════ */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};
    if (role)   filter.role   = role;
    if (status) filter.status = status;
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(filter).sort({ createdAt: -1 });
    // Attach claim counts
    const enriched = await Promise.all(users.map(async (u) => {
      const claimCount = await Claim.countDocuments({ userId: u._id });
      return { ...u.toPublic(), claims: claimCount, joined: u.createdAt?.toISOString().slice(0, 10) };
    }));

    res.json({ success: true, users: enriched });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
};

/* ════════════════ HOSPITALS ════════════════════════════════ */
exports.getHospitals = async (req, res, next) => {
  try {
    const { city, category, cashless, search } = req.query;
    const filter = {};
    if (city)     filter.city     = { $regex: city,     $options: 'i' };
    if (category) filter.category = { $regex: category, $options: 'i' };
    if (cashless !== undefined) filter.cashless = cashless === 'true';
    if (search)   filter.name     = { $regex: search,   $options: 'i' };

    const hospitals = await Hospital.find(filter).sort({ rating: -1 });
    res.json({ success: true, hospitals });
  } catch (err) { next(err); }
};

exports.getCities = async (req, res, next) => {
  try {
    const cities = await Hospital.distinct('city');
    res.json({ success: true, cities });
  } catch (err) { next(err); }
};

/* ════════════════ NOTIFICATIONS ════════════════════════════ */
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    if (req.params.id === 'all') {
      await Notification.updateMany({ userId: req.user._id }, { read: true });
    } else {
      await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { read: true });
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};

/* ════════════════ REIMBURSEMENTS ═══════════════════════════ */
exports.getReimbursements = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };
    const reimbursements = await Reimbursement
      .find(filter)
      .populate('claimId', 'claimNumber diagnosis amount')
      .sort({ createdAt: -1 });
    res.json({ success: true, reimbursements });
  } catch (err) { next(err); }
};

/* ════════════════ AUDIT LOGS (admin) ══════════════════════ */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const logs = await AuditLog
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await AuditLog.countDocuments();
    res.json({ success: true, logs, total });
  } catch (err) { next(err); }
};

/* ════════════════ ANALYTICS (admin) ═══════════════════════ */
exports.getAnalytics = async (req, res, next) => {
  try {
    // Claims by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const claimsByMonth = await Claim.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        approvedAmount: { $sum: { $ifNull: ['$approved', 0] } },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Claims by status
    const byStatus = await Claim.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top hospitals by claim count
    const topHospitals = await Claim.aggregate([
      { $group: { _id: '$hospital', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Average claim amount
    const [avg] = await Claim.aggregate([
      { $group: { _id: null, avg: { $avg: '$amount' }, sum: { $sum: '$amount' } } },
    ]);

    res.json({ success: true, analytics: { claimsByMonth, byStatus, topHospitals, avg } });
  } catch (err) { next(err); }
};
