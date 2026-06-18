require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const compression  = require('compression');
const rateLimit    = require('express-rate-limit');
const { logger }   = require('./utils/logger');

const app = express();

// ── CORS — allow all localhost ports ──────────────────────
app.use(cors({ origin:(origin,cb)=>cb(null,true), credentials:true, methods:['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders:['Content-Type','Authorization'] }));
app.options('*', cors());
app.use(helmet({ crossOriginResourcePolicy:false }));

const limiter     = rateLimit({ windowMs:15*60*1000, max:1000 });
const authLimiter = rateLimit({ windowMs:15*60*1000, max:100  });
app.use('/api/', limiter);
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true, limit:'10mb' }));

app.get('/api/health', (req,res) => res.json({ status:'OK', timestamp:new Date().toISOString(), version:'1.0.0' }));

app.use('/api/auth',          authLimiter, require('./routes/auth.routes'));
app.use('/api/schools',       require('./routes/school.routes'));
app.use('/api/dashboard',     require('./routes/dashboard.routes'));
app.use('/api/students',      require('./routes/student.routes'));
app.use('/api/employees',     require('./routes/employee.routes'));
app.use('/api/attendance',    require('./routes/attendance.routes'));
app.use('/api/fees',          require('./routes/fee.routes'));
app.use('/api/exams',         require('./routes/exam.routes'));
app.use('/api/enquiries',     require('./routes/enquiry.routes'));
app.use('/api/registrations', require('./routes/registration.routes'));
app.use('/api/rooms',    require('./routes/room.routes'));
app.use('/api/tc',       require('./routes/tc.routes'));
app.use('/api/notices',       require('./routes/notice.routes'));
app.use('/api/reports',       require('./routes/report.routes'));
app.use('/api/timetable',     require('./routes/timetable.routes'));
app.use('/api/transport',     require('./routes/transport.routes'));
app.use('/api/library',       require('./routes/library.routes'));
app.use('/api/expenses',      require('./routes/expense.routes'));
app.use('/api/payroll',       require('./routes/payroll.routes'));

app.use(require('./middleware/notFound.middleware').notFound);
app.use(require('./middleware/error.middleware').errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 EduManage API → http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}\n`);
});
module.exports = app;
