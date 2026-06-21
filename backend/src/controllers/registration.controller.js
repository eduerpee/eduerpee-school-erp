const db  = require('../config/database');
const { AppError } = require('../utils/AppError');
const { generateAdmissionNo } = require('../utils/generators');

async function genRegNo(schoolId) {
  const year  = new Date().getFullYear().toString().slice(-2);
  const count = await db.queryOne('SELECT COUNT(*) as cnt FROM registrations WHERE school_id=$1', [schoolId]);
  return 'REG' + year + String(parseInt(count.cnt) + 1).padStart(4, '0');
}

// GET /api/registrations
const getRegistrations = async (req, res) => {
  const { page=1, limit=100, status, search } = req.query;
  const offset = (parseInt(page)-1) * parseInt(limit);

  const rows = await db.queryAll(
    'SELECT * FROM get_registrations($1,$2,$3,$4,$5)',
    [req.schoolId, status||null, search||null, parseInt(limit), offset]
  );

  const countRow = await db.queryOne(
    `SELECT COUNT(*) FROM registrations
     WHERE school_id=$1
       AND ($2::VARCHAR IS NULL OR status=$2)
       AND ($3::VARCHAR IS NULL OR student_name ILIKE $3 OR mobile ILIKE $3 OR registration_no ILIKE $3)`,
    [req.schoolId, status||null, search?'%'+search+'%':null]
  );

  res.json({
    success: true,
    data:    rows,
    pagination: { total: parseInt(countRow?.count||0), page: parseInt(page), limit: parseInt(limit) }
  });
};

// POST /api/registrations
const createRegistration = async (req, res) => {
  const {
    studentName, parentName, mobile, email,
    desiredClass, previousSchool,
    registrationFee=500, feePaid=false,
    enquiryId, photoUrl,
    studentFirstName, studentLastName,
    dateOfBirth, gender, category
  } = req.body;

  if (!studentName || !mobile) throw new AppError('Student name and mobile are required', 400);

  const regNo      = await genRegNo(req.schoolId);
  const firstName  = studentFirstName || studentName.split(' ')[0];
  const lastName   = studentLastName  || studentName.split(' ').slice(1).join(' ') || '';

  const reg = await db.queryOne(
    'SELECT * FROM create_registration($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
    [req.schoolId, regNo, enquiryId||null,
     studentName, firstName, lastName,
     parentName||null, mobile, email||null,
     desiredClass||null, previousSchool||null,
     parseFloat(registrationFee)||500, feePaid?true:false,
     photoUrl||null, dateOfBirth||null, gender||'male', category||'general']
  );

  res.status(201).json({ success: true, data: reg, message: 'Registration ' + regNo + ' saved to database' });
};

// PUT /api/registrations/:id
const updateRegistration = async (req, res) => {
  const {
    studentName, parentName, mobile, email,
    desiredClass, previousSchool,
    registrationFee, feePaid, photoUrl,
    dateOfBirth, gender, category
  } = req.body;

  try {
    const reg = await db.queryOne(
      'SELECT * FROM update_registration($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [req.params.id, req.schoolId,
       studentName||null, parentName||null, mobile||null, email||null,
       desiredClass||null, previousSchool||null,
       registrationFee !== undefined ? parseFloat(registrationFee) : null,
       feePaid !== undefined ? feePaid : null,
       photoUrl||null,
       dateOfBirth||null, gender||null, category||null]
    );
    if (!reg) throw new AppError('Registration not found', 404);
    res.json({ success: true, data: reg, message: 'Registration updated successfully' });
  } catch (err) {
    if (err.message?.includes('converted')) throw new AppError('Cannot edit a converted registration', 400);
    throw err;
  }
};

// POST /api/registrations/:id/convert
const convertToStudent = async (req, res) => {
  const admissionNo = await generateAdmissionNo(req.schoolId);

  // Check registration exists and not already converted
  const reg = await db.queryOne(
    'SELECT * FROM registrations WHERE id=$1 AND school_id=$2',
    [req.params.id, req.schoolId]
  );
  if (!reg) throw new AppError('Registration not found', 404);
  if (reg.status === 'converted') throw new AppError('Already converted to student', 400);

  const ay = await db.queryOne(
    'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
    [req.schoolId]
  );

  // Resolve class and section
  let classId = null, sectionId = null;
  if (reg.desired_class) {
    const cls = await db.queryOne(
      'SELECT id FROM classes WHERE school_id=$1 AND name=$2 LIMIT 1',
      [req.schoolId, reg.desired_class]
    );
    if (cls) {
      classId = cls.id;
      const sec = await db.queryOne(
        "SELECT id FROM sections WHERE class_id=$1 AND name='A' LIMIT 1", [classId]
      );
      if (sec) sectionId = sec.id;
    }
  }

  const firstName = reg.student_first_name || reg.student_name.split(' ')[0];
  const lastName  = reg.student_last_name  || reg.student_name.split(' ').slice(1).join(' ') || '';

  let studentId;
  await db.transaction(async (client) => {
    const sRow = await client.query(
      `INSERT INTO students
         (school_id, admission_no, first_name, last_name,
          date_of_birth, gender, category,
          current_class_id, current_section_id, academic_year_id,
          admission_date, photo_url, previous_school,
          registration_id, enquiry_id, is_active, status, admission_fee_paid)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,$12,$13,$14,TRUE,'active',FALSE)
       RETURNING id`,
      [req.schoolId, admissionNo, firstName, lastName,
       reg.date_of_birth||null, reg.gender||'male', reg.category||'general',
       classId, sectionId, ay?.id||null,
       reg.photo_url||null, reg.previous_school||null,
       reg.id, reg.enquiry_id||null]
    );
    studentId = sRow.rows[0].id;

    if (reg.parent_name || reg.mobile) {
      await client.query(
        `INSERT INTO student_parents (student_id, relation, full_name, phone, email, is_primary_contact)
         VALUES ($1,'father',$2,$3,$4,TRUE)`,
        [studentId, reg.parent_name||'', reg.mobile||'', reg.email||null]
      );
    }
    await client.query("UPDATE registrations SET status='converted' WHERE id=$1", [reg.id]);
    if (reg.enquiry_id) {
      await client.query(
        "UPDATE enquiries SET status='converted', converted_to_student_id=$1 WHERE id=$2",
        [studentId, reg.enquiry_id]
      );
    }
  });

  res.json({
    success: true,
    message: 'Student admitted! Admission No: ' + admissionNo,
    data: {
      admissionNo,
      registration: { status: 'converted' },
      student: { admission_no: admissionNo, first_name: firstName, last_name: lastName }
    }
  });
};

module.exports = { getRegistrations, createRegistration, updateRegistration, convertToStudent };
