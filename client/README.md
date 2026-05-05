# InsureFlow — Health Insurance Claim Management Platform

A full-stack **MERN** (MongoDB, Express, React, Node.js) web application for filing, tracking, and adjudicating health insurance claims. Built as a university capstone project.

---

## 🚀 Features

| Module | Feature | Status |
|--------|---------|--------|
| 1 | User Authentication & Role-Based Access (Policyholder / Admin) | ✅ |
| 2 | 4-Step Claim Filing Wizard with Validation | ✅ |
| 3 | Claim Tracking with Timeline & Status Updates | ✅ |
| 4 | Reimbursement History & Settlement Records | ✅ |
| 5 | Admin Dashboard — Approve / Reject / Manage Users | ✅ |
| 6 | Hospital Network Search with Filters | ✅ |
| 7 | Analytics Dashboard with Charts & KPIs | ✅ |
| 8 | Audit Logs & Notifications | ✅ |

---

## 🛠️ Tech Stack

**Frontend**
- React 18 with Functional Components & Hooks
- Redux Toolkit (Global State — Auth & Claims)
- React Router v6 (Client-side Routing & Protected Routes)
- Custom CSS Design System

**Backend** *(planned)*
- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT Authentication (HttpOnly Cookies)
- AWS S3 for Document Storage

---

## ▶️ How to Run

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# App opens at http://localhost:3000
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Policyholder | arjun@example.com | demo1234 |
| Admin / Adjudicator | priya@insureflow.com | demo1234 |

> All data is mock/local — no backend required to run the frontend demo.

---

## 📁 Project Structure

```
src/
├── app/
│   └── store.js               # Redux store (RTK)
├── features/
│   ├── auth/authSlice.js      # Auth state slice
│   └── claims/claimsSlice.js  # Claims state slice
├── components/
│   ├── common/index.js        # StatusBadge, ToastContainer
│   └── layout/                # Sidebar, AppLayout
├── pages/
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── ClaimsPages.js         # MyClaimPage, ClaimDetail, NewClaimWizard
│   ├── HospitalsPage.js       # Hospital Network Search
│   ├── OtherPages.js          # Reimbursements, Profile, Notifications
│   └── AdminPages.js          # Admin Dashboard, Queue, Users, Analytics
├── hooks/useToast.js
├── utils/helpers.js
├── data/mockData.js
├── App.js
└── index.css
```

---

## 👨‍💻 Developer

University Project — Review 3  
Stack: MERN · React 18 · Redux Toolkit · React Router v6
