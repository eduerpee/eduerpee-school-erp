const db  = require('../config/database');
const { AppError } = require('../utils/AppError');

// POST /api/attendance/student/mark
const markStudentAttendance = async (req, res) => {
  const { date, attendance, classId, sectionId, academicYearId } = req.body;
  if (!date) throw new AppError('Date is required', 400);

  let records = Array.isArray(attendance)
    ? attendance
    : Object.entries(attendance||{}).map(([studentId, status]) => ({ studentId, status }));

  if (!records.length) throw new AppError('No attendance records provided', 400);

  let ayId = academicYearId;
  if (!ayId) {
    const ay = await db.queryOne(
      'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
      [req.schoolId]
    );
    ayId = ay?.id || null;
  }

  const validStatuses = ['present','absent','leave','late','half_day'];
  let inserted = 0, updated = 0;

  for (const rec of records) {
    if (!rec.studentId || !rec.status) continue;
    const status = validStatuses.includes(rec.status) ? rec.status : 'present';

    let cId = classId, sId = sectionId;
    if (!cId) {
      const st = await db.queryOne(
        'SELECT current_class_id, current_section_id FROM students WHERE id=$1 AND school_id=$2',
        [rec.studentId, req.schoolId]
      );
      cId = st?.current_class_id;
      sId = st?.current_section_id;
    }

    const existing = await db.queryOne(
      'SELECT id FROM student_attendance WHERE student_id=$1 AND date=$2 AND school_id=$3',
      [rec.studentId, date, req.schoolId]
    );

    await db.query(
      'SELECT mark_attendance($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [req.schoolId, rec.studentId, cId||null, sId||null, ayId,
       date, status, rec.remarks||null, req.user?.id||null]
    );

    existing ? updated++ : inserted++;
  }

  res.json({
    success: true,
    message: 'Attendance saved! Inserted: ' + inserted + ', Updated: ' + updated,
    data:    { date, inserted, updated, total: records.length }
  });
};

// GET /api/attendance/student/class
const getClassAttendance = async (req, res) => {
  const { classId, sectionId, date } = req.query;
  if (!date) throw new AppError('Date is required', 400);

  const records = await db.queryAll(
    'SELECT * FROM get_class_attendance($1,$2,$3,$4)',
    [req.schoolId, classId||null, sectionId||null, date]
  );
  res.json({ success: true, data: records });
};

// GET /api/attendance/student/:studentId/monthly
const getStudentMonthlyAttendance = async (req, res) => {
  const m = parseInt(req.query.month) || (new Date().getMonth() + 1);
  const y = parseInt(req.query.year)  || new Date().getFullYear();

  const records = await db.queryAll(
    'SELECT * FROM get_student_monthly_attendance($1,$2,$3,$4)',
    [req.params.studentId, req.schoolId, m, y]
  );
  res.json({ success: true, data: records });
};

// GET /api/attendance/report
const getAttendanceReport = async (req, res) => {
  const reportDate = req.query.date || new Date().toISOString().split('T')[0];
  const classId    = req.query.classId || null;

  const summary = await db.queryAll(
    'SELECT * FROM get_attendance_report($1,$2,$3)',
    [req.schoolId, reportDate, classId]
  );
  res.json({ success: true, data: summary, date: reportDate });
};

module.exports = { markStudentAttendance, getClassAttendance, getStudentMonthlyAttendance, getAttendanceReport };
