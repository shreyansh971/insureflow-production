const mongoose = require('mongoose');

/* ─── Hospital ─────────────────────────────────────────── */
const HospitalSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  city:     { type: String, required: true },
  category: { type: String, required: true },
  beds:     { type: Number, required: true },
  cashless: { type: Boolean, default: true },
  rating:   { type: Number, min: 0, max: 5 },
  address:  { type: String },
  phone:    { type: String },
  email:    { type: String },
}, { timestamps: true });

/* ─── Notification ─────────────────────────────────────── */
const NotificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['success', 'info', 'warning', 'error'], default: 'info' },
  title:   { type: String, required: true },
  msg:     { type: String, required: true },
  read:    { type: Boolean, default: false },
  claimId: { type: String },
}, { timestamps: true });

/* ─── AuditLog ─────────────────────────────────────────── */
const AuditLogSchema = new mongoose.Schema({
  adminId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName:  { type: String, required: true },
  action:     { type: String, required: true },   // e.g. "CLAIM_APPROVED"
  entityType: { type: String },                    // e.g. "Claim"
  entityId:   { type: String },
  details:    { type: String },
  ip:         { type: String },
}, { timestamps: true });

/* ─── Reimbursement ────────────────────────────────────── */
const ReimbursementSchema = new mongoose.Schema({
  claimId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  amount:   { type: Number, required: true },
  method:   { type: String, default: 'NEFT' },
  bank:     { type: String },
  account:  { type: String },
  ref:      { type: String },
  status:   { type: String, enum: ['pending', 'processing', 'credited', 'failed'], default: 'processing' },
}, { timestamps: true });

module.exports = {
  Hospital:       mongoose.model('Hospital',       HospitalSchema),
  Notification:   mongoose.model('Notification',   NotificationSchema),
  AuditLog:       mongoose.model('AuditLog',       AuditLogSchema),
  Reimbursement:  mongoose.model('Reimbursement',  ReimbursementSchema),
};
