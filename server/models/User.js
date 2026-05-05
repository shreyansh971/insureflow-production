const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PolicySchema = new mongoose.Schema({
  id:             { type: String, required: true },
  provider:       { type: String, required: true },
  coverageLimit:  { type: Number, required: true },
  remaining:      { type: Number, required: true },
  validFrom:      { type: String, required: true },
  validUntil:     { type: String, required: true },
  type:           { type: String, default: 'Individual Floater' },
  premium:        { type: Number, required: true },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true, minlength: 6, select: false },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  initials:   { type: String },
  phone:      { type: String },
  dob:        { type: String },
  gender:     { type: String },
  address:    { type: String },
  department: { type: String },        // admin only
  status:     { type: String, enum: ['active', 'inactive'], default: 'active' },
  policy:     { type: PolicySchema },  // user only
}, { timestamps: true });

// Auto-generate initials
UserSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.initials = this.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  next();
});

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare passwords
UserSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Instance method: safe public profile (strips password)
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
