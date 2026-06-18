const db = require('../config/database');
const { AppError } = require('../utils/AppError');

function calcGrade(marks, max) {
  if (!marks || !max) return '—';
  const p = (marks/max)*100;
  return p>=90?'A+':p>=80?'A':p>=70?'B+':p>=60?'B':p>=50?'C':p>=33?'D':'F';
}

const getExams = async (req, res) => {
  const rows = await db.queryAll(
    `SELECT id, name, exam_type::TEXT as exam_type,
            TO_CHAR(start_date,'YYYY-MM-DD') as start_date,
            TO_CHAR(end_date,'YYYY-MM-DD') as end_date,
            is_active, created_at
     FROM exams WHERE school_id=$1 AND is_active=TRUE
     ORDER BY start_date DESC`,
    [req.schoolId]
  );
  res.json({ success:true, data:rows });
};

const createExam = async (req, res) => {
  const { name, examType, startDate, endDate, academicYearId } = req.body;
  if (!name || !examType) throw new AppError('Name and exam type required', 400);
  const ay = academicYearId || (await db.queryOne(
    'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
    [req.schoolId]
  ))?.id;
  const exam = await db.queryOne(
    `INSERT INTO exams (school_id, academic_year_id, name, exam_type, start_date, end_date, is_active)
     VALUES ($1,$2,$3,$4::exam_type,$5,$6,TRUE) RETURNING *, exam_type::TEXT as exam_type`,
    [req.schoolId, ay||null, name, examType, startDate||null, endDate||null]
  );
  res.status(201).json({ success:true, data:exam, message:'Exam created' });
};

const getSchedules = async (req, res) => {
  const { examId } = req.query;
  if (!examId) { res.json({ success:true, data:[] }); return; }
  const rows = await db.queryAll(
    `SELECT es.id, TO_CHAR(es.exam_date,'YYYY-MM-DD') as exam_date,
            es.start_time::TEXT, es.end_time::TEXT,
            es.max_marks, es.pass_marks, es.room_no,
            sub.id as subject_id, sub.name as subject_name,
            c.id as class_id, c.name as class_name
     FROM exam_schedules es
     LEFT JOIN subjects sub ON es.subject_id=sub.id
     LEFT JOIN classes  c   ON es.class_id=c.id
     WHERE es.exam_id=$1 ORDER BY es.exam_date, sub.name`,
    [examId]
  );
  res.json({ success:true, data:rows });
};

const addSchedule = async (req, res) => {
  const { examId, classId, subjectName, subjectId, examDate, startTime, endTime, maxMarks, passMarks } = req.body;
  if (!examId || !classId) throw new AppError('examId and classId required', 400);
  let sid = subjectId || null;
  if (!sid && subjectName) {
    const school = await db.queryOne('SELECT school_id FROM exams WHERE id=$1', [examId]);
    let sub = await db.queryOne('SELECT id FROM subjects WHERE school_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1', [school.school_id, subjectName]);
    if (!sub) sub = await db.queryOne('INSERT INTO subjects (school_id,name,is_active) VALUES ($1,$2,TRUE) RETURNING id', [school.school_id, subjectName]);
    sid = sub.id;
  }
  if (!sid) throw new AppError('Subject required', 400);
  const row = await db.queryOne(
    `INSERT INTO exam_schedules (exam_id,class_id,subject_id,exam_date,start_time,end_time,max_marks,pass_marks)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [examId, classId, sid, examDate||null, startTime||null, endTime||null, parseInt(maxMarks)||100, parseInt(passMarks)||33]
  );
  res.status(201).json({ success:true, data:row });
};

const getStudentsForClass = async (req, res) => {
  const { classId, scheduleId } = req.query;
  if (!classId) throw new AppError('classId required', 400);
  const rows = await db.queryAll(
    `SELECT s.id, s.admission_no, s.first_name, s.last_name,
            s.roll_no, s.gender::TEXT as gender, s.photo_url,
            sm.id as mark_id, sm.marks_obtained, sm.is_absent, sm.grade, sm.remarks
     FROM students s
     JOIN classes c ON s.current_class_id=c.id AND c.id=$1
     LEFT JOIN student_marks sm ON sm.student_id=s.id
       AND ($2::UUID IS NULL OR sm.exam_schedule_id=$2)
     WHERE s.is_active=TRUE AND s.school_id=$3
     ORDER BY s.roll_no NULLS LAST, s.first_name`,
    [classId, scheduleId||null, req.schoolId]
  );
  res.json({ success:true, data:rows });
};

const saveMarks = async (req, res) => {
  const { marks } = req.body;
  if (!marks?.length) throw new AppError('No marks provided', 400);
  await db.transaction(async (client) => {
    for (const m of marks) {
      const grade = calcGrade(m.marksObtained, m.maxMarks);
      await client.query(
        `INSERT INTO student_marks (exam_id,exam_schedule_id,student_id,subject_id,marks_obtained,is_absent,grade,entered_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (exam_schedule_id,student_id)
         DO UPDATE SET marks_obtained=EXCLUDED.marks_obtained, is_absent=EXCLUDED.is_absent,
           grade=EXCLUDED.grade, entered_by=EXCLUDED.entered_by`,
        [m.examId, m.examScheduleId, m.studentId, m.subjectId,
         m.isAbsent?null:(parseFloat(m.marksObtained)||0),
         m.isAbsent||false, m.isAbsent?'AB':grade, req.user?.id||null]
      );
    }
  });
  res.json({ success:true, message: marks.length + ' marks saved' });
};

const getResults = async (req, res) => {
  const { examId, classId } = req.query;
  if (!examId) throw new AppError('examId required', 400);
  const rows = await db.queryAll(
    `SELECT s.id as student_id, s.admission_no, s.first_name, s.last_name, s.roll_no,
            sub.name as subject_name, es.max_marks, es.pass_marks,
            sm.marks_obtained, sm.is_absent, sm.grade
     FROM exam_schedules es
     JOIN subjects sub ON es.subject_id=sub.id
     JOIN classes  esc ON es.class_id=esc.id
     JOIN students s   ON s.current_class_id=esc.id AND s.is_active=TRUE AND s.school_id=$1
     LEFT JOIN student_marks sm ON sm.student_id=s.id AND sm.exam_schedule_id=es.id
     WHERE es.exam_id=$2
       AND ($3::UUID IS NULL OR esc.id=$3)
     ORDER BY s.admission_no, sub.name`,
    [req.schoolId, examId, classId||null]
  );
  res.json({ success:true, data:rows });
};

module.exports = { getExams, createExam, getSchedules, addSchedule, getStudentsForClass, saveMarks, getResults };
