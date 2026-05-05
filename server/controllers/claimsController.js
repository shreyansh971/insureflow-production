const Claim        = require('../models/Claim');
const User         = require('../models/User');
const { Notification, AuditLog, Reimbursement } = require('../models/index');

/* ── helpers ── */
const today = () => new Date().toISOString().slice(0, 10);

const createNotification = async (userId, type, title, msg, claimId) => {
  try {
    await Notification.create({ userId, type, title, msg, claimId });
  } catch (e) {
    console.error('Notification create failed:', e.message);
  }
};

const createAuditLog = async (req, action, entityId, details) => {
  try {
    await AuditLog.create({
      adminId:   req.user._id,
      adminName: req.user.name,
      action, entityType: 'Claim', entityId, details,
      ip: req.ip,
    });
  } catch (e) {
    console.error('AuditLog create failed:', e.message);
  }
};

/* ── GET /api/claims ── (admin: all | user: own) */
exports.getClaims = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id };

    const { status, page = 1, limit = 20 } = req.query;
    if (status) filter.status = status;

    const claims = await Claim.find(filter)
      .populate('userId', 'name email initials')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Claim.countDocuments(filter);

    res.json({ success: true, claims, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/claims/:id ── */
exports.getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { claimNumber: req.params.id }],
    }).populate('userId', 'name email initials phone policy');

    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    // Users may only see their own claims
    if (req.user.role === 'user' && String(claim.userId._id) !== String(req.user._id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/claims ── */
exports.createClaim = async (req, res, next) => {
  try {
    const { amount, diagnosis, icd, hospital, dateFrom, dateTo } = req.body;

    // Check coverage limit
    const user = await User.findById(req.user._id);
    if (user.policy && amount > user.policy.remaining) {
      // flag conflict but still allow submission
    }

    const conflict = user.policy ? amount > user.policy.remaining : false;

    const claim = await Claim.create({
      userId: req.user._id,
      amount, diagnosis, icd, hospital, dateFrom, dateTo,
      status: 'pending',
      conflict,
      docs: req.files ? req.files.map((f) => f.filename) : [],
      timeline: [{ status: 'pending', date: today(), remark: 'Claim submitted by policyholder' }],
    });

    await createNotification(
      req.user._id, 'info', 'Claim Submitted',
      `Your claim for ₹${amount.toLocaleString('en-IN')} (${diagnosis}) has been submitted.`,
      claim.claimNumber,
    );

    res.status(201).json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/claims/:id/approve ── (admin only) */
exports.approveClaim = async (req, res, next) => {
  try {
    const { approvedAmount, remarks } = req.body;
    const claim = await Claim.findOne({ claimNumber: req.params.id });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (['approved', 'rejected'].includes(claim.status))
      return res.status(400).json({ success: false, message: `Claim is already ${claim.status}` });

    const settled = today();
    claim.status   = 'approved';
    claim.approved = approvedAmount;
    claim.remarks  = remarks || '';
    claim.settledAt = settled;
    claim.timeline.push({ status: 'approved', date: settled, remark: remarks || 'Approved by adjudicator.' });
    await claim.save();

    // Reduce policy remaining
    await User.findByIdAndUpdate(claim.userId, {
      $inc: { 'policy.remaining': -approvedAmount },
    });

    // Create reimbursement record
    await Reimbursement.create({
      claimId: claim._id, userId: claim.userId,
      amount: approvedAmount, method: 'NEFT',
      ref: `NEFT${Date.now()}`, status: 'processing',
    });

    await createNotification(
      claim.userId, 'success', 'Claim Approved',
      `Your claim ${claim.claimNumber} for ₹${approvedAmount.toLocaleString('en-IN')} has been approved.`,
      claim.claimNumber,
    );

    await createAuditLog(req, 'CLAIM_APPROVED', claim.claimNumber,
      `Approved ₹${approvedAmount} — ${remarks}`);

    res.json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/claims/:id/reject ── (admin only) */
exports.rejectClaim = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const claim = await Claim.findOne({ claimNumber: req.params.id });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    if (['approved', 'rejected'].includes(claim.status))
      return res.status(400).json({ success: false, message: `Claim is already ${claim.status}` });

    const settled = today();
    claim.status  = 'rejected';
    claim.remarks = reason;
    claim.settledAt = settled;
    claim.timeline.push({ status: 'rejected', date: settled, remark: reason });
    await claim.save();

    await createNotification(
      claim.userId, 'error', 'Claim Rejected',
      `Your claim ${claim.claimNumber} was rejected. Reason: ${reason}`,
      claim.claimNumber,
    );

    await createAuditLog(req, 'CLAIM_REJECTED', claim.claimNumber, `Rejected — ${reason}`);

    res.json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/claims/:id/under-review ── (admin only) */
exports.setUnderReview = async (req, res, next) => {
  try {
    const claim = await Claim.findOne({ claimNumber: req.params.id });
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    claim.status = 'under-review';
    claim.timeline.push({ status: 'under-review', date: today(), remark: `Assigned to ${req.user.name}` });
    await claim.save();

    await createAuditLog(req, 'CLAIM_UNDER_REVIEW', claim.claimNumber, '');
    res.json({ success: true, claim });
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/claims/stats ── (admin) */
exports.getStats = async (req, res, next) => {
  try {
    const [total, pending, underReview, approved, rejected] = await Promise.all([
      Claim.countDocuments(),
      Claim.countDocuments({ status: 'pending' }),
      Claim.countDocuments({ status: 'under-review' }),
      Claim.countDocuments({ status: 'approved' }),
      Claim.countDocuments({ status: 'rejected' }),
    ]);

    const approvedClaims = await Claim.find({ status: 'approved' }).select('approved');
    const totalPaid = approvedClaims.reduce((s, c) => s + (c.approved || 0), 0);

    res.json({ success: true, stats: { total, pending, underReview, approved, rejected, totalPaid } });
  } catch (err) {
    next(err);
  }
};
