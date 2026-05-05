require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const fs          = require('fs');

const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const authRoutes     = require('./routes/auth');
const claimsRoutes   = require('./routes/claims');
const otherRoutes    = require('./routes/other');

/* ── Connect DB ── */
connectDB();

const app = express();

/* ── Security & Logging ── */
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ── Rate limiting ── */
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
}));

/* ── CORS ── */
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Body parsers ── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ── Static: uploaded docs ── */
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

/* ── API Routes ── */
app.use('/api/auth',   authRoutes);
app.use('/api/claims', claimsRoutes);
app.use('/api',        otherRoutes);

/* ── Health check ── */
app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

/* ── Serve React build in production ── */
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'build');
  app.use(express.static(clientBuild));
  app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

app.get('/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const Claim = require('./models/Claim');
    const { Hospital } = require('./models/index');
    const existing = await User.countDocuments();
    if (existing > 0) return res.json({ message: 'Already seeded!' });
    await User.create({ name: 'Priya Mehta', email: 'priya@insureflow.com', password: 'admin123', role: 'admin', phone: '+91 99887 76655', department: 'Claims Adjudication', status: 'active' });
    await Hospital.insertMany([
      { name: 'Apollo Hospital', city: 'Chennai', category: 'Multi-Specialty', beds: 520, cashless: true, rating: 4.8 },
      { name: 'Fortis Malar', city: 'Chennai', category: 'Cardiac Care', beds: 280, cashless: true, rating: 4.6 },
      { name: 'MIOT International', city: 'Chennai', category: 'Orthopedic', beds: 400, cashless: true, rating: 4.7 },
      { name: 'Manipal Hospital', city: 'Bangalore', category: 'Multi-Specialty', beds: 600, cashless: true, rating: 4.7 },
      { name: 'Kokilaben Dhirubhai', city: 'Mumbai', category: 'Multi-Specialty', beds: 750, cashless: true, rating: 4.8 },
    ]);
    res.json({ success: true, message: 'Database seeded! Admin: priya@insureflow.com / admin123' });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

/* ── Error handler (must be last) ── */
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀  InsureFlow server running on port ${PORT} [${process.env.NODE_ENV}]`));

module.exports = app;
