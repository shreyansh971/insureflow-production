const mongoose = require('mongoose');

const TimelineEntrySchema = new mongoose.Schema({
  status:  { type: String, required: true },
  date:    { type: String, required: true },
  remark:  { type: String, default: '' },
}, { _id: false });

const ClaimSchema = new mongoose.Schema({
  claimNumber: { type: String, unique: true },   // CLM-YYYYMMDD-XXXXX
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:      { type: Number, required: true },
  approved:    { type: Number, default: null },
  diagnosis:   { type: String, required: true },
  icd:         { type: String },
  hospital:    { type: String, required: true },
  dateFrom:    { type: String, required: true },
  dateTo:      { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'under-review', 'approved', 'rejected'],
    default: 'pending',
  },
  docs:      [{ type: String }],
  remarks:   { type: String, default: '' },
  conflict:  { type: Boolean, default: false },
  settledAt: { type: String },
  timeline:  [TimelineEntrySchema],
}, { timestamps: true });

// Auto-generate claim number before save
ClaimSchema.pre('save', async function (next) {
  if (this.isNew && !this.claimNumber) {
    const today = new Date();
    const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    this.claimNumber = `CLM-${datePart}-${rand}`;
  }
  next();
});

// Virtual: expose claimNumber as "id" for frontend compatibility
ClaimSchema.virtual('id').get(function () {
  return this.claimNumber;
});

ClaimSchema.set('toJSON', { virtuals: true });
ClaimSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Claim', ClaimSchema);
