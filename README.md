# InsureFlow — Production-Ready Full-Stack

Health insurance management platform upgraded from a React mock-data demo to a full
**Node.js + Express + MongoDB** production stack with JWT auth, role-based access control,
real file uploads, audit logging, and analytics.

---

## Architecture

```
insureflow-production/
├── server/                      ← Node.js + Express backend
│   ├── server.js                ← Entry point (helmet, CORS, rate-limit, routes)
│   ├── config/db.js             ← Mongoose connection
│   ├── middleware/
│   │   ├── auth.js              ← JWT protect + adminOnly guards
│   │   └── errorHandler.js      ← Central error handler
│   ├── models/
│   │   ├── User.js              ← User + embedded Policy schema
│   │   ├── Claim.js             ← Claims with auto-generated claim numbers
│   │   └── index.js             ← Hospital, Notification, AuditLog, Reimbursement
│   ├── controllers/
│   │   ├── authController.js    ← Login, register, getMe, updateMe, changePassword
│   │   ├── claimsController.js  ← CRUD + approve/reject + stats
│   │   └── otherControllers.js  ← Users, hospitals, notifications, reimbursements, analytics, audit
│   ├── routes/
│   │   ├── auth.js
│   │   ├── claims.js            ← Multer file uploads (PDF/JPG/PNG, max 10 MB × 5)
│   │   └── other.js
│   ├── uploads/                 ← Claim document storage (auto-created)
│   ├── seed.js                  ← Populate demo data
│   └── .env.example
│
└── client/                      ← React 18 frontend (CRA)
    └── src/
        ├── services/api.js      ← Axios instance + all API helpers
        ├── features/
        │   ├── auth/authSlice.js     ← Async thunks + localStorage persistence
        │   └── claims/claimsSlice.js ← Async thunks, normalised state
        ├── app/store.js
        └── pages/ components/ hooks/ utils/ (original, unchanged)
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ running locally **or** a MongoDB Atlas URI

### 1 — Install dependencies

```bash
cd insureflow-production
npm install           # installs concurrently at root
npm run install:all   # installs server + client deps
```

### 2 — Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env:
#   MONGO_URI   = mongodb://localhost:27017/insureflow
#   JWT_SECRET  = <random 32+ char string>
```

### 3 — Seed the database

```bash
npm run seed
```

Outputs:
```
✅  Seed complete!
   User:  arjun@example.com  / password123
   Admin: priya@insureflow.com / admin123
```

### 4 — Start development servers

```bash
npm run dev
```

- **API:**    http://localhost:5000
- **React:**  http://localhost:3000  (proxied to 5000)

---

## API Reference

All endpoints return `{ success: boolean, ...payload }`.
Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path                      | Auth | Description         |
|--------|---------------------------|------|---------------------|
| POST   | /api/auth/login           | —    | Login               |
| POST   | /api/auth/register        | —    | Register new user   |
| GET    | /api/auth/me              | ✓    | Get own profile     |
| PUT    | /api/auth/me              | ✓    | Update profile      |
| PUT    | /api/auth/change-password | ✓    | Change password     |

### Claims

| Method | Path                         | Auth  | Description         |
|--------|------------------------------|-------|---------------------|
| GET    | /api/claims                  | ✓     | List (own/all)      |
| GET    | /api/claims/stats            | Admin | Aggregate stats     |
| GET    | /api/claims/:id              | ✓     | Claim detail        |
| POST   | /api/claims                  | ✓     | Submit claim + docs |
| PUT    | /api/claims/:id/approve      | Admin | Approve             |
| PUT    | /api/claims/:id/reject       | Admin | Reject              |
| PUT    | /api/claims/:id/under-review | Admin | Set under review    |

### Other

| Method | Path                       | Auth  | Description       |
|--------|----------------------------|-------|-------------------|
| GET    | /api/hospitals             | ✓     | Hospital network  |
| GET    | /api/hospitals/cities      | ✓     | Distinct cities   |
| GET    | /api/notifications         | ✓     | User notifications|
| PUT    | /api/notifications/:id/read| ✓     | Mark read         |
| GET    | /api/reimbursements        | ✓     | Reimbursements    |
| GET    | /api/users                 | Admin | All users         |
| PUT    | /api/users/:id/status      | Admin | Toggle status     |
| GET    | /api/audit-logs            | Admin | Audit trail       |
| GET    | /api/analytics             | Admin | Aggregated charts |

---

## Key Production Features

| Feature | Implementation |
|---|---|
| **JWT Auth** | `jsonwebtoken` — 7d expiry, stored in localStorage |
| **Password hashing** | `bcryptjs` — 12 salt rounds |
| **Role guards** | `protect` + `adminOnly` middleware |
| **Rate limiting** | 20 req/15 min on /auth, 200 req/15 min globally |
| **Security headers** | `helmet` |
| **File uploads** | `multer` — PDF/JPG/PNG, 10 MB cap, 5 files per claim |
| **Auto claim numbers** | `CLM-YYYYMMDD-NNNNN` generated pre-save |
| **Audit trail** | Every admin action logged with IP |
| **Notifications** | Created automatically on approve/reject |
| **Coverage tracking** | `policy.remaining` decremented on approval |
| **Analytics** | MongoDB aggregations — monthly trends, top hospitals |
| **Error handling** | Centralised handler — Mongoose, JWT, duplicate key |

---

## Production Deployment

### Build React

```bash
npm run build
```

### Set environment

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
PORT=5000
CLIENT_URL=https://yourdomain.com
```

The Express server will serve the React build automatically when `NODE_ENV=production`.

---

## Demo Credentials

| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| User  | arjun@example.com        | password123 |
| Admin | priya@insureflow.com     | admin123    |
