const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect route — verifies JWT from Authorization header or cookie.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Restrict to admin role only.
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * Attach requesting IP to req for audit logging.
 */
const attachIP = (req, _res, next) => {
  req.ip = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  next();
};

module.exports = { protect, adminOnly, attachIP };
