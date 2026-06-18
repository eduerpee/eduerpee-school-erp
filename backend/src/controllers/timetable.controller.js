const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const getTimetable = async (req, res) => {
  const { classId, sectionId, teacherId } = req.query;
  const rows = await db.queryAll(
    `SELECT t.id, t.class_id, t.section_id, t.subject_id, t.teacher_id,
            t.day_of_week, t.period_no, t.start_time::TEXT, t.end_time::TEXT, t.room_no,
            sub.name as subject_name,
            u.full_name as teacher_name,
            e.id as employee_id_ref
     FROM timetable t
     LEFT JOIN subjects sub ON t.subject_id=sub.id
     LEFT JOIN users    u   ON t.teacher_id=u.id
     LEFT JOIN employees e  ON e.user_id=u.id AND e.school_id=$1
     WHERE t.school_id=$1
       AND ($2::UUID IS NULL OR t.class_id=$2)
       AND ($3::UUID IS NULL OR t.section_id=$3)
       AND ($4::UUID IS NULL OR t.teacher_id=$4)
     ORDER BY t.day_of_week, t.period_no`,
    [req.schoolId, classId||null, sectionId||null, teacherId||null]
  );
  res.json({ success:true, data:rows });
};

const saveTimetable = async (req, res) => {
  const { classId, sectionId, dayOfWeek, periodNo, subjectId, subjectName, teacherId, startTime, endTime, roomNo } = req.body;
  if (!classId || !dayOfWeek || !periodNo) throw new AppError('classId, dayOfWeek and periodNo required', 400);

  let sid = subjectId || null;
  if (!sid && subjectName) {
    let sub = await db.queryOne('SELECT id FROM subjects WHERE school_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1', [req.schoolId, subjectName]);
    if (!sub) sub = await db.queryOne('INSERT INTO subjects (school_id,name,is_active) VALUES ($1,$2,TRUE) RETURNING id', [req.schoolId, subjectName]);
    sid = sub.id;
  }
  if (!sid) throw new AppError('Subject required', 400);

  // teacherId could be employee.id or user.id — resolve to user_id
  let resolvedTeacherId = null;
  if (teacherId) {
    // Check if it's already a user_id
    const asUser = await db.queryOne('SELECT id FROM users WHERE id=$1', [teacherId]);
    if (asUser) {
      resolvedTeacherId = teacherId;
    } else {
      // Try as employee.id → get user_id
      const emp = await db.queryOne('SELECT user_id FROM employees WHERE id=$1', [teacherId]);
      resolvedTeacherId = emp?.user_id || null;
    }
  }

  // Find existing slot
  const existing = await db.queryOne(
    `SELECT id FROM timetable
     WHERE class_id=$1 AND day_of_week=$2 AND period_no=$3
       AND (section_id=$4 OR (section_id IS NULL AND $4::UUID IS NULL))`,
    [classId, parseInt(dayOfWeek), parseInt(periodNo), sectionId||null]
  );

  let slot;
  if (existing) {
    slot = await db.queryOne(
      `UPDATE timetable SET subject_id=$1, teacher_id=$2, start_time=$3, end_time=$4, room_no=$5
       WHERE id=$6 RETURNING *`,
      [sid, resolvedTeacherId, startTime||null, endTime||null, roomNo||null, existing.id]
    );
  } else {
    slot = await db.queryOne(
      `INSERT INTO timetable
         (school_id, class_id, section_id, subject_id, teacher_id, day_of_week, period_no, start_time, end_time, room_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.schoolId, classId, sectionId||null, sid, resolvedTeacherId,
       parseInt(dayOfWeek), parseInt(periodNo), startTime||null, endTime||null, roomNo||null]
    );
  }
  res.json({ success:true, data:slot, message:'Timetable slot saved' });
};

const deleteTimetableSlot = async (req, res) => {
  await db.query('DELETE FROM timetable WHERE id=$1 AND school_id=$2', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Slot deleted' });
};

module.exports = { getTimetable, saveTimetable, deleteTimetableSlot };
