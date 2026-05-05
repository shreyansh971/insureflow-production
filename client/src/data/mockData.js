export const MOCK_USERS = {
  user: {
    id: 'u1', name: 'Arjun Sharma', email: 'arjun@example.com',
    role: 'user', initials: 'AS',
    phone: '+91 98765 43210', dob: '1992-05-14', gender: 'Male',
    address: '42, Anna Nagar, Chennai - 600040',
    policy: {
      id: 'POL-2024-8821', provider: 'Star Health Insurance',
      coverageLimit: 500000, remaining: 312000,
      validFrom: '2024-01-01', validUntil: '2024-12-31',
      type: 'Individual Floater', premium: 12500,
    },
  },
  admin: {
    id: 'a1', name: 'Priya Mehta', email: 'priya@insureflow.com',
    role: 'admin', initials: 'PM',
    phone: '+91 99887 76655', department: 'Claims Adjudication',
  },
};

export const INITIAL_CLAIMS = [
  {
    id: 'CLM-20240612-45231', userId: 'u1',
    amount: 45000, approved: 45000,
    diagnosis: 'Appendectomy', icd: 'K35.80',
    hospital: 'Apollo Hospital, Chennai',
    dateFrom: '2024-06-05', dateTo: '2024-06-10',
    status: 'approved',
    docs: ['bill_apollo.pdf', 'discharge_summary.pdf'],
    remarks: 'All documents verified. Policy coverage confirmed.',
    created: '2024-06-12', conflict: false,
    timeline: [
      { status: 'pending',       date: '2024-06-12', remark: 'Claim submitted by policyholder' },
      { status: 'under-review',  date: '2024-06-13', remark: 'Assigned to adjudicator Priya Mehta' },
      { status: 'approved',      date: '2024-06-15', remark: 'All documents verified. Policy coverage confirmed.' },
    ],
  },
  {
    id: 'CLM-20240718-38712', userId: 'u1',
    amount: 28500, approved: null,
    diagnosis: 'Cardiac Stress Test + Angiography', icd: 'I25.10',
    hospital: 'Fortis Malar, Chennai',
    dateFrom: '2024-07-14', dateTo: '2024-07-16',
    status: 'under-review',
    docs: ['lab_report.pdf', 'bill_fortis.pdf', 'ecg_report.pdf'],
    remarks: '', created: '2024-07-18', conflict: false,
    timeline: [
      { status: 'pending',      date: '2024-07-18', remark: 'Claim submitted by policyholder' },
      { status: 'under-review', date: '2024-07-19', remark: 'Documents under verification' },
    ],
  },
  {
    id: 'CLM-20240801-91045', userId: 'u1',
    amount: 380000, approved: null,
    diagnosis: 'Knee Replacement Surgery', icd: 'M17.11',
    hospital: 'MIOT International, Chennai',
    dateFrom: '2024-07-28', dateTo: '2024-08-01',
    status: 'pending',
    docs: ['surgery_bill.pdf'],
    remarks: '', created: '2024-08-01', conflict: true,
    timeline: [
      { status: 'pending', date: '2024-08-01', remark: 'Claim submitted by policyholder' },
    ],
  },
  {
    id: 'CLM-20240320-22187', userId: 'u1',
    amount: 12000, approved: null,
    diagnosis: 'Viral Fever + Dengue', icd: 'A97.0',
    hospital: 'Kauvery Hospital, Chennai',
    dateFrom: '2024-03-15', dateTo: '2024-03-18',
    status: 'rejected',
    docs: ['lab_dengue.pdf', 'bill_kauvery.pdf'],
    remarks: 'Pre-existing condition clause applies. Dengue listed as exclusion in Year 1.',
    created: '2024-03-20', conflict: false,
    timeline: [
      { status: 'pending',      date: '2024-03-20', remark: 'Claim submitted by policyholder' },
      { status: 'under-review', date: '2024-03-21', remark: 'Documents reviewed' },
      { status: 'rejected',     date: '2024-03-22', remark: 'Pre-existing condition clause applies.' },
    ],
  },
];

// ── Module 5: Admin — manage users ──
export const MOCK_ALL_USERS = [
  { id: 'u1', name: 'Arjun Sharma',   email: 'arjun@example.com',   phone: '+91 98765 43210', role: 'user',  status: 'active',   joined: '2024-01-10', policyId: 'POL-2024-8821', claims: 4 },
  { id: 'u2', name: 'Kavya Rajan',    email: 'kavya@example.com',   phone: '+91 87654 32109', role: 'user',  status: 'active',   joined: '2024-02-14', policyId: 'POL-2024-3312', claims: 2 },
  { id: 'u3', name: 'Mohammed Irfan', email: 'irfan@example.com',   phone: '+91 76543 21098', role: 'user',  status: 'inactive', joined: '2023-11-05', policyId: 'POL-2023-9921', claims: 1 },
  { id: 'u4', name: 'Sneha Pillai',   email: 'sneha@example.com',   phone: '+91 65432 10987', role: 'user',  status: 'active',   joined: '2024-03-22', policyId: 'POL-2024-5544', claims: 3 },
  { id: 'a1', name: 'Priya Mehta',    email: 'priya@insureflow.com',phone: '+91 99887 76655', role: 'admin', status: 'active',   joined: '2023-06-01', policyId: '—',             claims: 0 },
];

// ── Module 6: Search & Filters — hospital network ──
export const HOSPITAL_NETWORK = [
  { id: 'h1', name: 'Apollo Hospital',         city: 'Chennai',   category: 'Multi-Specialty', beds: 520, cashless: true,  rating: 4.8 },
  { id: 'h2', name: 'Fortis Malar',            city: 'Chennai',   category: 'Cardiac Care',    beds: 280, cashless: true,  rating: 4.6 },
  { id: 'h3', name: 'MIOT International',      city: 'Chennai',   category: 'Orthopedic',      beds: 400, cashless: true,  rating: 4.7 },
  { id: 'h4', name: 'Kauvery Hospital',         city: 'Chennai',   category: 'Multi-Specialty', beds: 350, cashless: true,  rating: 4.5 },
  { id: 'h5', name: 'Manipal Hospital',         city: 'Bangalore', category: 'Multi-Specialty', beds: 600, cashless: true,  rating: 4.7 },
  { id: 'h6', name: 'Narayana Health',          city: 'Bangalore', category: 'Cardiac Care',    beds: 1000,cashless: true,  rating: 4.6 },
  { id: 'h7', name: 'AIIMS',                    city: 'Delhi',     category: 'Government',      beds: 2400,cashless: false, rating: 4.9 },
  { id: 'h8', name: 'Max Super Speciality',     city: 'Delhi',     category: 'Multi-Specialty', beds: 450, cashless: true,  rating: 4.5 },
  { id: 'h9', name: 'Kokilaben Dhirubhai',      city: 'Mumbai',    category: 'Multi-Specialty', beds: 750, cashless: true,  rating: 4.8 },
  { id:'h10', name: 'Lilavati Hospital',         city: 'Mumbai',    category: 'Multi-Specialty', beds: 320, cashless: true,  rating: 4.4 },
];

// ── Module 4: Order / Reimbursement history ──
export const REIMBURSEMENT_HISTORY = [
  { id: 'RMB-001', claimId: 'CLM-20240612-45231', amount: 45000, method: 'NEFT', bank: 'HDFC Bank', account: '****4521', date: '2024-06-17', status: 'credited', ref: 'NEFT24168045231' },
];

// ── Notification data ──
export const NOTIFICATIONS = [
  { id:'n1', type:'success', title:'Claim Approved',    msg:'Your claim CLM-20240612-45231 for ₹45,000 has been approved.',              time:'2 days ago', read: false },
  { id:'n2', type:'info',    title:'Under Review',      msg:'Claim CLM-20240718-38712 is now being reviewed by an adjudicator.',         time:'5 days ago', read: false },
  { id:'n3', type:'warning', title:'Action Required',   msg:'Claim CLM-20240801-91045 flagged — coverage limit exceeded.',               time:'Today',      read: false },
  { id:'n4', type:'error',   title:'Claim Rejected',    msg:'Claim CLM-20240320-22187 was rejected. See remarks for details.',           time:'Mar 22',     read: true  },
  { id:'n5', type:'info',    title:'Premium Due',       msg:'Your policy POL-2024-8821 premium of ₹12,500 is due on Dec 31, 2024.',     time:'1 week ago',  read: true  },
];
