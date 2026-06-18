const db = require('../config/database');

// GET /api/reports/fee-summary
const getFeeSummary = async (req, res) => {
  const { academicYearId, fromDate, toDate } = req.query;
  const [monthly, classwise, modewise] = await Promise.all([
    db.queryAll(`
      SELECT TO_CHAR(payment_date,'Month YYYY') as month,
             TO_CHAR(payment_date,'YYYY-MM') as sort_key,
             SUM(amount) as collected, COUNT(*) as transactions
      FROM fee_payments WHERE school_id=$1 AND is_cancelled=FALSE
        AND ($2::date IS NULL OR payment_date::date >= $2)
        AND ($3::date IS NULL OR payment_date::date <= $3)
      GROUP BY month, sort_key ORDER BY sort_key`,
      [req.schoolId, fromDate||null, toDate||null]),
    db.queryAll(`
      SELECT c.name as class_name,
             COALESCE(SUM(sf.paid_amount),0) as collected,
             COALESCE(SUM(sf.net_amount - sf.paid_amount),0) as pending,
             COUNT(DISTINCT sf.student_id) as students
      FROM classes c
      LEFT JOIN students s ON s.current_class_id=c.id AND s.school_id=$1
      LEFT JOIN student_fees sf ON sf.student_id=s.id
      WHERE c.school_id=$1 GROUP BY c.id, c.name, c.numeric_level ORDER BY c.numeric_level`,
      [req.schoolId]),
    db.queryAll(`
      SELECT payment_mode, COUNT(*) as count, SUM(amount) as total
      FROM fee_payments WHERE school_id=$1 AND is_cancelled=FALSE
      GROUP BY payment_mode ORDER BY total DESC`,
      [req.schoolId])
  ]);
  res.json({ success: true, data: { monthly, classwise, modewise } });
};

// GET /api/reports/attendance-summary
const getAttendanceSummary = async (req, res) => {
  const { classId, fromDate, toDate } = req.query;
  const rows = await db.queryAll(`
    SELECT s.admission_no, s.first_name, s.last_name, c.name as class_name,
           COUNT(*) FILTER (WHERE sa.status='present') as present,
           COUNT(*) FILTER (WHERE sa.status='absent') as absent,
           COUNT(*) FILTER (WHERE sa.status='leave') as leave,
           COUNT(DISTINCT sa.date) as total_days,
           ROUND(COUNT(*) FILTER (WHERE sa.status='present') * 100.0 / NULLIF(COUNT(DISTINCT sa.date),0), 1) as pct
    FROM students s
    LEFT JOIN student_attendance sa ON sa.student_id=s.id
      AND ($2::date IS NULL OR sa.date>=$2)
      AND ($3::date IS NULL OR sa.date<=$3)
    LEFT JOIN classes c ON s.current_class_id=c.id
    WHERE s.school_id=$1 AND s.is_active=TRUE
      AND ($4::uuid IS NULL OR s.current_class_id=$4)
    GROUP BY s.id, s.admission_no, s.first_name, s.last_name, c.name
    ORDER BY pct`,
    [req.schoolId, fromDate||null, toDate||null, classId||null]
  );
  res.json({ success: true, data: rows });
};

// GET /api/reports/student-strength
const getStudentStrength = async (req, res) => {
  const rows = await db.queryAll(`
    SELECT c.name as class_name, sec.name as section_name,
           COUNT(s.id) as strength,
           COUNT(s.id) FILTER (WHERE s.gender='male') as boys,
           COUNT(s.id) FILTER (WHERE s.gender='female') as girls
    FROM classes c
    LEFT JOIN sections sec ON sec.class_id=c.id
    LEFT JOIN students s ON s.current_class_id=c.id AND s.current_section_id=sec.id AND s.is_active=TRUE
    WHERE c.school_id=$1 AND c.is_active=TRUE
    GROUP BY c.id, c.name, c.numeric_level, sec.name
    ORDER BY c.numeric_level, sec.name`,
    [req.schoolId]
  );
  res.json({ success: true, data: rows });
};

module.exports = { getFeeSummary, getAttendanceSummary, getStudentStrength };
