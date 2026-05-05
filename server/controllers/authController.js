const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/* ── helpers ── */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const respond = (res, statusCode, user) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:        user._id,
      id:         user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      initials:   user.initials,
      phone:      user.phone,
      dob:        user.dob,
      gender:     user.gender,
      address:    user.address,
      department: user.department,
      status:     user.status,
      policy:     user.policy,
    },
  });
};

/* ── POST /api/auth/login ── */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.status === 'inactive')
      return res.status(403).json({ success: false, message: 'Account is inactive' });

    respond(res, 200, user);
  } catch (err) {
    next(err);
  }
};

/* ── POST /api/auth/register ── */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const today = new Date();
    const policyId = `POL-${today.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name, email, password, phone,
      role: 'user',
      policy: {
        id:            policyId,
        provider:      'Star Health Insurance',
        coverageLimit: 500000,
        remaining:     500000,
        validFrom:     today.toISOString().slice(0, 10),
        validUntil:    `${today.getFullYear() + 1}-12-31`,
        type:          'Individual Floater',
        premium:       12500,
      },
    });

    respond(res, 201, user);
  } catch (err) {
    next(err);
  }
};

/* ── GET /api/auth/me ── */
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublic ? req.user.toPublic() : req.user });
};

/* ── PUT /api/auth/me ── */
exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'dob', 'gender', 'address'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublic ? user.toPublic() : user });
  } catch (err) {
    next(err);
  }
};

/* ── PUT /api/auth/change-password ── */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    respond(res, 200, user);
  } catch (err) {
    next(err);
  }
};
