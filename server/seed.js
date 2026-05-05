/**
 * seed.js — Populate MongoDB with demo data.
 * Run: node seed.js
 */
require('dotenv').config();
const mongoose     = require('mongoose');
const connectDB    = require('./config/db');
const User         = require('./models/User');
const Claim        = require('./models/Claim');
const { Hospital, Notification, Reimbursement } = require('./models/index');

const run = async () => {
  await connectDB();

  console.log('🌱  Seeding database…');

  // Clear all collections
  await Promise.all([
    User.deleteMany(),
    Claim.deleteMany(),
    Hospital.deleteMany(),
    Notification.deleteMany(),
    Reimbursement.deleteMany(),
  ]);

  /* ── Users — use User.create() so bcrypt pre-save hook fires ── */
  const [arjun, kavya, irfan, sneha, priya] = await Promise.all([
    User.create({
      name: 'Arjun Sharma', email: 'arjun@example.com', password: 'password123',
      role: 'user', phone: '+91 98765 43210', dob: '1992-05-14', gender: 'Male',
      address: '42, Anna Nagar, Chennai - 600040', status: 'active',
      policy: { id: 'POL-2024-8821', provider: 'Star Health Insurance',
        coverageLimit: 500000, remaining: 312000,
        validFrom: '2024-01-01', validUntil: '2025-12-31',
        type: 'Individual Floater', premium: 12500 },
    }),
    User.create({
      name: 'Kavya Rajan', email: 'kavya@example.com', password: 'password123',
      role: 'user', phone: '+91 87654 32109', status: 'active',
      policy: { id: 'POL-2024-3312', provider: 'HDFC ERGO Health',
        coverageLimit: 300000, remaining: 280000,
        validFrom: '2024-02-14', validUntil: '2025-12-31',
        type: 'Individual Floater', premium: 9500 },
    }),
    User.create({
      name: 'Mohammed Irfan', email: 'irfan@example.com', password: 'password123',
      role: 'user', phone: '+91 76543 21098', status: 'inactive',
      policy: { id: 'POL-2023-9921', provider: 'Niva Bupa',
        coverageLimit: 500000, remaining: 450000,
        validFrom: '2023-11-05', validUntil: '2024-11-04',
        type: 'Individual Floater', premium: 11000 },
    }),
    User.create({
      name: 'Sneha Pillai', email: 'sneha@example.com', password: 'password123',
      role: 'user', phone: '+91 65432 10987', status: 'active',
      policy: { id: 'POL-2024-5544', provider: 'Bajaj Allianz',
        coverageLimit: 1000000, remaining: 900000,
        validFrom: '2024-03-22', validUntil: '2025-12-31',
        type: 'Family Floater', premium: 22000 },
    }),
    User.create({
      name: 'Priya Mehta', email: 'priya@insureflow.com', password: 'admin123',
      role: 'admin', phone: '+91 99887 76655', department: 'Claims Adjudication',
      status: 'active',
    }),
  ]);

  /* ── Claims ── */
  const claims = await Claim.insertMany([
    {
      userId: arjun._id, amount: 45000, approved: 45000,
      diagnosis: 'Appendectomy', icd: 'K35.80',
      hospital: 'Apollo Hospital, Chennai',
      dateFrom: '2024-06-05', dateTo: '2024-06-10',
      status: 'approved', conflict: false,
      docs: ['bill_apollo.pdf', 'discharge_summary.pdf'],
      remarks: 'All documents verified. Policy coverage confirmed.',
      settledAt: '2024-06-15',
      timeline: [
        { status: 'pending',      date: '2024-06-12', remark: 'Claim submitted by policyholder' },
        { status: 'under-review', date: '2024-06-13', remark: 'Assigned to adjudicator Priya Mehta' },
        { status: 'approved',     date: '2024-06-15', remark: 'All documents verified.' },
      ],
    },
    {
      userId: arjun._id, amount: 28500, approved: null,
      diagnosis: 'Cardiac Stress Test + Angiography', icd: 'I25.10',
      hospital: 'Fortis Malar, Chennai',
      dateFrom: '2024-07-14', dateTo: '2024-07-16',
      status: 'under-review', conflict: false,
      docs: ['lab_report.pdf', 'bill_fortis.pdf', 'ecg_report.pdf'],
      remarks: '',
      timeline: [
        { status: 'pending',      date: '2024-07-18', remark: 'Claim submitted by policyholder' },
        { status: 'under-review', date: '2024-07-19', remark: 'Documents under verification' },
      ],
    },
    {
      userId: arjun._id, amount: 380000, approved: null,
      diagnosis: 'Knee Replacement Surgery', icd: 'M17.11',
      hospital: 'MIOT International, Chennai',
      dateFrom: '2024-07-28', dateTo: '2024-08-01',
      status: 'pending', conflict: true,
      docs: ['surgery_bill.pdf'], remarks: '',
      timeline: [{ status: 'pending', date: '2024-08-01', remark: 'Claim submitted by policyholder' }],
    },
    {
      userId: arjun._id, amount: 12000, approved: null,
      diagnosis: 'Viral Fever + Dengue', icd: 'A97.0',
      hospital: 'Kauvery Hospital, Chennai',
      dateFrom: '2024-03-15', dateTo: '2024-03-18',
      status: 'rejected', conflict: false,
      docs: ['lab_dengue.pdf', 'bill_kauvery.pdf'],
      remarks: 'Pre-existing condition clause applies. Dengue listed as exclusion in Year 1.',
      timeline: [
        { status: 'pending',      date: '2024-03-20', remark: 'Claim submitted by policyholder' },
        { status: 'under-review', date: '2024-03-21', remark: 'Documents reviewed' },
        { status: 'rejected',     date: '2024-03-22', remark: 'Pre-existing condition clause applies.' },
      ],
    },
    {
      userId: kavya._id, amount: 15000, approved: 15000,
      diagnosis: 'Laparoscopic Cholecystectomy', icd: 'K80.20',
      hospital: 'Manipal Hospital, Bangalore',
      dateFrom: '2024-04-10', dateTo: '2024-04-12',
      status: 'approved', conflict: false,
      docs: ['bill_manipal.pdf'], remarks: 'Approved',
      timeline: [
        { status: 'pending',  date: '2024-04-12', remark: 'Submitted' },
        { status: 'approved', date: '2024-04-14', remark: 'Verified and approved.' },
      ],
    },
    {
      userId: sneha._id, amount: 72000, approved: null,
      diagnosis: 'Fracture — Right Femur', icd: 'S72.30',
      hospital: 'Kokilaben Dhirubhai, Mumbai',
      dateFrom: '2024-08-01', dateTo: '2024-08-07',
      status: 'pending', conflict: false,
      docs: ['xray.pdf', 'bill.pdf'], remarks: '',
      timeline: [{ status: 'pending', date: '2024-08-07', remark: 'Submitted' }],
    },
  ]);

  /* ── Hospitals ── */
  await Hospital.insertMany([
    { name: 'Apollo Hospital',       city: 'Chennai',   category: 'Multi-Specialty', beds: 520,  cashless: true,  rating: 4.8 },
    { name: 'Fortis Malar',          city: 'Chennai',   category: 'Cardiac Care',    beds: 280,  cashless: true,  rating: 4.6 },
    { name: 'MIOT International',    city: 'Chennai',   category: 'Orthopedic',      beds: 400,  cashless: true,  rating: 4.7 },
    { name: 'Kauvery Hospital',      city: 'Chennai',   category: 'Multi-Specialty', beds: 350,  cashless: true,  rating: 4.5 },
    { name: 'Manipal Hospital',      city: 'Bangalore', category: 'Multi-Specialty', beds: 600,  cashless: true,  rating: 4.7 },
    { name: 'Narayana Health',       city: 'Bangalore', category: 'Cardiac Care',    beds: 1000, cashless: true,  rating: 4.6 },
    { name: 'AIIMS',                 city: 'Delhi',     category: 'Government',      beds: 2400, cashless: false, rating: 4.9 },
    { name: 'Max Super Speciality',  city: 'Delhi',     category: 'Multi-Specialty', beds: 450,  cashless: true,  rating: 4.5 },
    { name: 'Kokilaben Dhirubhai',   city: 'Mumbai',    category: 'Multi-Specialty', beds: 750,  cashless: true,  rating: 4.8 },
    { name: 'Lilavati Hospital',     city: 'Mumbai',    category: 'Multi-Specialty', beds: 320,  cashless: true,  rating: 4.4 },
  ]);

  /* ── Reimbursement for approved claim ── */
  await Reimbursement.create({
    claimId: claims[0]._id, userId: arjun._id,
    amount: 45000, method: 'NEFT', bank: 'HDFC Bank',
    account: '****4521', ref: 'NEFT24168045231', status: 'credited',
  });

  /* ── Notifications ── */
  await Notification.insertMany([
    { userId: arjun._id, type: 'success', title: 'Claim Approved',   msg: 'Your claim for ₹45,000 (Appendectomy) has been approved.',   read: false },
    { userId: arjun._id, type: 'info',    title: 'Under Review',     msg: 'Claim CLM for Cardiac Stress Test is now being reviewed.',     read: false },
    { userId: arjun._id, type: 'warning', title: 'Action Required',  msg: 'Claim for Knee Replacement flagged — coverage limit exceeded.', read: false },
    { userId: arjun._id, type: 'error',   title: 'Claim Rejected',   msg: 'Claim for Viral Fever was rejected. See remarks for details.',  read: true  },
    { userId: arjun._id, type: 'info',    title: 'Premium Due',      msg: 'Your policy premium of ₹12,500 is due on Dec 31, 2025.',        read: true  },
  ]);

  console.log('✅  Seed complete!');
  console.log('\n📋  Demo credentials:');
  console.log('   User:  arjun@example.com / password123');
  console.log('   Admin: priya@insureflow.com / admin123');
  await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });
