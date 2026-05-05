const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();
const ctrl    = require('../controllers/claimsController');
const { protect, adminOnly } = require('../middleware/auth');

// Multer — store uploaded docs in /uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  },
});

router.get   ('/',         protect, ctrl.getClaims);
router.get   ('/stats',    protect, adminOnly, ctrl.getStats);
router.get   ('/:id',      protect, ctrl.getClaimById);
router.post  ('/',         protect, upload.array('docs', 5), ctrl.createClaim);
router.put   ('/:id/approve',      protect, adminOnly, ctrl.approveClaim);
router.put   ('/:id/reject',       protect, adminOnly, ctrl.rejectClaim);
router.put   ('/:id/under-review', protect, adminOnly, ctrl.setUnderReview);

module.exports = router;
