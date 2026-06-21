const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express    = require('express');
require('express-async-errors'); // ← catches all async throws automatically
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
require('dotenv').config();

const app = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── School + Auth middleware ───────────────────────────────────
const { authenticate } = require('./middleware/auth.middleware');

// Inject schoolId into every request
app.use((req, res, next) => {
  req.schoolId = process.env.SCHOOL_ID || 'a0000000-0000-0000-0000-000000000001';
  next();
});

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/schools',       require('./routes/school.routes'));
app.use('/api/dashboard',     require('./routes/dashboard.routes'));
app.use('/api/enquiries',     require('./routes/enquiry.routes'));
app.use('/api/registrations', require('./routes/registration.routes'));
app.use('/api/students',      require('./routes/student.routes'));
app.use('/api/attendance',    require('./routes/attendance.routes'));
app.use('/api/exams',         require('./routes/exam.routes'));
app.use('/api/timetable',     require('./routes/timetable.routes'));
app.use('/api/fees',          require('./routes/fee.routes'));
app.use('/api/expenses',      require('./routes/expense.routes'));
app.use('/api/employees',     require('./routes/employee.routes'));
app.use('/api/transport',     require('./routes/transport.routes'));
app.use('/api/library',       require('./routes/library.routes'));
app.use('/api/notices',       require('./routes/notice.routes'));
app.use('/api/rooms',         require('./routes/room.routes'));
app.use('/api/tc',            require('./routes/tc.routes'));
app.use('/api/reports',       require('./routes/report.routes'));

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler (must be last) ──────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // PostgreSQL errors
  if (err.code === '23505') return res.status(409).json({ success: false, message: 'A record with this information already exists.' });
  if (err.code === '23503') return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  if (err.code === '23514') return res.status(400).json({ success: false, message: 'Data validation failed. Check amounts and constraints.' });

  // JWT errors
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });

  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── Start server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   School ID  : ${process.env.SCHOOL_ID || 'a0000000-0000-0000-0000-000000000001'}`);
});

module.exports = app;
