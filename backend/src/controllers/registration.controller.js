const db = require('../config/database');
const { AppError } = require('../utils/AppError');

// GET /api/registrations
const getRegistrations = async (req, res) => {
  try {
    const rows = await db.queryAll(
      `SELECT r.id, r.school_id, r.status,
              r.first_name, r.last_name, r.date_of_birth,
              r.gender, r.blood_group, r.category,
              r.photo_url, r.previous_school, r.remarks,
              r.class_id, r.section_id,
              r.parent_name, r.parent_phone, r.parent_email,
              r.address, r.created_at, r.updated_at,
              c.name   as class_name,
              sec.name as section_name
       FROM registrations r
       LEFT JOIN classes  c   ON r.class_id   = c.id
       LEFT JOIN sections sec ON r.section_id = sec.id
       WHERE r.school_id = $1
       ORDER BY r.created_at DESC`,
      [req.schoolId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getRegistrations error:', err.message);
    // If table missing — return empty array gracefully
    if (err.message.includes('does not exist') || err.message.includes('relation')) {
      return res.json({ success: true, data: [] });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/registrations
const createRegistration = async (req, res) => {
  const {
    firstName, lastName, dateOfBirth, gender, bloodGroup,
    classId, sectionId, parentName, parentPhone, parentEmail,
    address, category, photoUrl, previousSchool, remarks
  } = req.body;

  if (!firstName) throw new AppError('First name required', 400);
  if (!parentPhone) throw new AppError('Parent phone required', 400);

  try {
    const row = await db.queryOne(
      `INSERT INTO registrations
         (school_id, first_name, last_name, date_of_birth, gender,
          blood_group, class_id, section_id, parent_name, parent_phone,
          parent_email, address, category, photo_url,
          previous_school, remarks, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending')
       RETURNING *`,
      [req.schoolId, firstName.trim(), lastName||null,
       dateOfBirth||null, gender||null, bloodGroup||null,
       classId||null, sectionId||null,
       parentName||null, parentPhone.trim(), parentEmail||null,
       address||null, category||null, photoUrl||null,
       previousSchool||null, remarks||null]
    );
    res.status(201).json({ success: true, data: row, message: 'Registration submitted successfully' });
  } catch (err) {
    console.error('createRegistration error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/registrations/:id
const updateRegistration = async (req, res) => {
  const {
    firstName, lastName, dateOfBirth, gender, bloodGroup,
    classId, sectionId, parentName, parentPhone, parentEmail,
    address, category, photoUrl, previousSchool, remarks, status
  } = req.body;

  try {
    const row = await db.queryOne(
      `UPDATE registrations SET
         first_name      = COALESCE($1,  first_name),
         last_name       = COALESCE($2,  last_name),
         date_of_birth   = COALESCE($3,  date_of_birth),
         gender          = COALESCE($4,  gender),
         blood_group     = COALESCE($5,  blood_group),
         class_id        = COALESCE($6,  class_id),
         section_id      = COALESCE($7,  section_id),
         parent_name     = COALESCE($8,  parent_name),
         parent_phone    = COALESCE($9,  parent_phone),
         parent_email    = COALESCE($10, parent_email),
         address         = COALESCE($11, address),
         category        = COALESCE($12, category),
         photo_url       = COALESCE($13, photo_url),
         previous_school = COALESCE($14, previous_school),
         remarks         = COALESCE($15, remarks),
         status          = COALESCE($16::VARCHAR, status),
         updated_at      = NOW()
       WHERE id = $17 AND school_id = $18
       RETURNING *`,
      [firstName||null, lastName||null, dateOfBirth||null,
       gender||null, bloodGroup||null, classId||null, sectionId||null,
       parentName||null, parentPhone||null, parentEmail||null,
       address||null, category||null, photoUrl||null,
       previousSchool||null, remarks||null, status||null,
       req.params.id, req.schoolId]
    );
    if (!row) throw new AppError('Registration not found', 404);
    res.json({ success: true, data: row, message: 'Updated successfully' });
  } catch (err) {
    console.error('updateRegistration error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/registrations/:id
const deleteRegistration = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM registrations WHERE id=$1 AND school_id=$2',
      [req.params.id, req.schoolId]
    );
    res.json({ success: true, message: 'Registration deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/registrations/:id/convert
const convertToStudent = async (req, res) => {
  try {
    const reg = await db.queryOne(
      'SELECT * FROM registrations WHERE id=$1 AND school_id=$2',
      [req.params.id, req.schoolId]
    );
    if (!reg) throw new AppError('Registration not found', 404);
    if (reg.status === 'admitted')
      throw new AppError('Already admitted as student', 400);

    // Academic year
    const ay = await db.queryOne(
      'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
      [req.schoolId]
    );

    // Generate admission number
    const count = await db.queryOne(
      'SELECT COUNT(*) as cnt FROM students WHERE school_id=$1',
      [req.schoolId]
    );
    const admNo = 'ADM' + String(new Date().getFullYear()).slice(-2) +
      String(parseInt(count?.cnt || 0) + 1).padStart(4, '0');

    // Insert student
    const student = await db.queryOne(
      `INSERT INTO students
         (school_id, academic_year_id, admission_no,
          first_name, last_name, date_of_birth, gender,
          blood_group, category, photo_url,
          current_class_id, current_section_id,
          is_active, admission_fee_paid, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,TRUE,FALSE,'active')
       RETURNING *`,
      [req.schoolId, ay?.id||null, admNo,
       reg.first_name, reg.last_name||null,
       reg.date_of_birth||null, reg.gender||null,
       reg.blood_group||null, reg.category||null, reg.photo_url||null,
       reg.class_id||null, reg.section_id||null]
    );

    // Parent record
    if (reg.parent_name || reg.parent_phone) {
      await db.query(
        `INSERT INTO student_parents
           (student_id, school_id, full_name, phone, email,
            relationship, is_primary_contact)
         VALUES ($1,$2,$3,$4,$5,'parent',TRUE)
         ON CONFLICT DO NOTHING`,
        [student.id, req.schoolId,
         reg.parent_name||null, reg.parent_phone||null, reg.parent_email||null]
      );
    }

    // Mark registration as admitted
    // Try with student_id column, fallback without
    try {
      await db.query(
        `UPDATE registrations
         SET status='admitted', student_id=$1, updated_at=NOW()
         WHERE id=$2 AND school_id=$3`,
        [student.id, req.params.id, req.schoolId]
      );
    } catch (e) {
      // student_id column might not exist
      await db.query(
        `UPDATE registrations
         SET status='admitted', updated_at=NOW()
         WHERE id=$1 AND school_id=$2`,
        [req.params.id, req.schoolId]
      );
    }

    res.status(201).json({
      success: true,
      data: { student, admissionNo: admNo },
      message: `Student admitted! Admission No: ${admNo}`
    });
  } catch (err) {
    console.error('convertToStudent error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getRegistrations, createRegistration,
  updateRegistration, deleteRegistration, convertToStudent
};
