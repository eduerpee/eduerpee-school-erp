const db  = require('../config/database');
const { AppError } = require('../utils/AppError');
const { generateAdmissionNo } = require('../utils/generators');

// GET /api/students
const getStudents = async (req, res) => {
  const { page=1, limit=20, search, className, sectionId, status, admissionPending } = req.query;
  const offset = (parseInt(page)-1) * parseInt(limit);

  const rows = await db.queryAll(
    `SELECT s.id, s.admission_no, s.first_name, s.last_name,
            s.date_of_birth::DATE, s.gender::VARCHAR, s.status::VARCHAR,
            s.admission_date::DATE, s.roll_no, s.category::VARCHAR,
            s.photo_url, s.blood_group::VARCHAR,
            s.registration_id, s.enquiry_id, s.current_class_id,
            s.admission_fee_paid,
            c.name  as class_name,  c.id as class_id,
            sec.name as section_name, sec.id as section_id,
            sp.full_name as parent_name, sp.phone as parent_phone, sp.email as parent_email,
            tr.id as route_id, tr.route_name, tr.monthly_fee as transport_fee,
            CASE
              WHEN COUNT(sf.id) = 0 THEN 'pending'
              WHEN SUM(CASE WHEN sf.status != 'paid' THEN 1 ELSE 0 END) = 0 THEN 'paid'
              ELSE 'partial'
            END::TEXT as fee_status
     FROM students s
     LEFT JOIN classes  c   ON s.current_class_id   = c.id
     LEFT JOIN sections sec ON s.current_section_id = sec.id
     LEFT JOIN student_parents    sp ON sp.student_id = s.id AND sp.is_primary_contact = TRUE
     LEFT JOIN student_fees       sf ON sf.student_id  = s.id
     LEFT JOIN student_transport  st ON st.student_id  = s.id
     LEFT JOIN transport_routes   tr ON tr.id = st.route_id
     WHERE s.school_id = $1 AND s.is_active = TRUE
       AND ($2::VARCHAR IS NULL OR s.first_name ILIKE $2 OR s.last_name ILIKE $2 OR s.admission_no ILIKE $2 OR sp.phone ILIKE $2)
       AND ($3::VARCHAR IS NULL OR c.name = $3)
       AND ($4::uuid IS NULL OR s.current_section_id = $4)
       AND ($5::VARCHAR IS NULL OR s.status::VARCHAR = $5)
     GROUP BY s.id, c.name, c.id, sec.name, sec.id,
              sp.full_name, sp.phone, sp.email,
              tr.id, tr.route_name, tr.monthly_fee
     ORDER BY s.first_name, s.last_name
     LIMIT $6 OFFSET $7`,
    [req.schoolId,
     search    ? '%'+search+'%' : null,
     className || null,
     sectionId || null,
     status    || null,
     parseInt(limit), offset]
  );

  const countRow = await db.queryOne(
    `SELECT COUNT(*) FROM students s
     WHERE s.school_id=$1 AND s.is_active=TRUE`,
    [req.schoolId]
  );

  res.json({
    success: true,
    data:    rows,
    pagination: { total: parseInt(countRow?.count||0), page: parseInt(page), limit: parseInt(limit) }
  });
};

// GET /api/students/:id
const getStudent = async (req, res) => {
  const rows = await db.queryAll(
    'SELECT * FROM get_student($1,$2)',
    [req.params.id, req.schoolId]
  );
  if (!rows?.length) throw new AppError('Student not found', 404);
  const student = rows[0];

  const [parents, fees] = await Promise.all([
    db.queryAll('SELECT * FROM student_parents WHERE student_id=$1', [student.id]),
    db.queryAll(`SELECT sf.*, ft.name as fee_type_name FROM student_fees sf
                 JOIN fee_types ft ON sf.fee_type_id=ft.id
                 WHERE sf.student_id=$1 ORDER BY sf.due_date DESC`, [student.id]),
  ]);

  res.json({ success: true, data: { ...student, parents, fees } });
};

// POST /api/students
const createStudent = async (req, res) => {
  const {
    firstName, lastName, dateOfBirth, gender, bloodGroup, category,
    aadhaarNo, religion, currentClassId, currentSectionId, academicYearId,
    className, sectionName, admissionDate, previousSchool,
    addressLine1, city, state, pincode, parents, photoUrl,
  } = req.body;

  if (!firstName) throw new AppError('First name is required', 400);

  let classUUID = currentClassId || null;
  let sectionUUID = currentSectionId || null;
  let ayUUID = academicYearId || null;

  if (!classUUID && className) {
    const cls = await db.queryOne(
      'SELECT id FROM classes WHERE school_id=$1 AND name=$2 LIMIT 1',
      [req.schoolId, className]
    );
    if (cls) {
      classUUID = cls.id;
    } else {
      const lvl = parseInt((className.match(/\d+/)||[0])[0]) || 0;
      const newCls = await db.queryOne(
        'INSERT INTO classes (school_id,name,numeric_level,is_active) VALUES ($1,$2,$3,TRUE) RETURNING id',
        [req.schoolId, className, lvl]
      );
      classUUID = newCls.id;
    }
  }
  if (!classUUID) throw new AppError('Class is required', 400);

  if (!sectionUUID) {
    const nm  = sectionName || 'A';
    const sec = await db.queryOne(
      'SELECT id FROM sections WHERE class_id=$1 AND name=$2 LIMIT 1',
      [classUUID, nm]
    );
    sectionUUID = sec ? sec.id : (await db.queryOne(
      'INSERT INTO sections (class_id,school_id,name,is_active) VALUES ($1,$2,$3,TRUE) RETURNING id',
      [classUUID, req.schoolId, nm]
    )).id;
  }

  if (!ayUUID) {
    const ay = await db.queryOne(
      'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
      [req.schoolId]
    );
    ayUUID = ay?.id || null;
  }

  const admissionNo = await generateAdmissionNo(req.schoolId);

  await db.transaction(async (client) => {
    const studentRow = await client.query(
      `INSERT INTO students
         (school_id, admission_no, first_name, last_name, date_of_birth,
          gender, blood_group, category, aadhaar_no,
          current_class_id, current_section_id, admission_date, academic_year_id,
          previous_school, address_line1, city, state, pincode,
          religion, photo_url, is_active, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,TRUE,'active')
       RETURNING *`,
      [req.schoolId, admissionNo, firstName, lastName||'',
       dateOfBirth||null, gender||'male', bloodGroup||null, category||'general', aadhaarNo||null,
       classUUID, sectionUUID, admissionDate||new Date(), ayUUID,
       previousSchool||null, addressLine1||null, city||null, state||null, pincode||null,
       religion||null, photoUrl||null]
    );
    const studentId = studentRow.rows[0].id;

    if (parents?.length) {
      for (const p of parents) {
        await client.query(
          `INSERT INTO student_parents (student_id,relation,full_name,phone,alternate_phone,email,occupation,is_primary_contact)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [studentId, p.relation||'father', p.fullName||'', p.phone||'',
           p.alternatePhone||null, p.email||null, p.occupation||null, p.isPrimaryContact!==false]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: studentRow.rows[0],
      message: 'Student admitted. Admission No: ' + admissionNo
    });
  });
};

// PUT /api/students/:id
const updateStudent = async (req, res) => {
  const {
    firstName, lastName, dateOfBirth, gender, bloodGroup,
    category, photoUrl, className, sectionName, previousSchool,
    parentFullName, parentPhone, parentEmail,
    addressLine1, city, state, pincode, aadhaarNo
  } = req.body;

  // Validate gender
  const validGenders = ['male','female','other'];
  const safeGender = validGenders.includes(gender) ? gender : null;

  // Validate category
  const validCategories = ['general','obc','sc','st','ews'];
  const safeCategory = validCategories.includes(category) ? category : null;

  // Resolve class UUID
  let classUUID = null, sectionUUID = null;
  if (className) {
    const cls = await db.queryOne(
      'SELECT id FROM classes WHERE school_id=$1 AND name=$2 LIMIT 1',
      [req.schoolId, className]
    );
    if (cls) {
      classUUID = cls.id;
      if (sectionName) {
        let sec = await db.queryOne(
          'SELECT id FROM sections WHERE class_id=$1 AND name=$2 LIMIT 1',
          [classUUID, sectionName]
        );
        if (!sec) sec = await db.queryOne(
          'INSERT INTO sections (class_id,school_id,name,is_active) VALUES ($1,$2,$3,TRUE) RETURNING id',
          [classUUID, req.schoolId, sectionName]
        );
        sectionUUID = sec?.id || null;
      }
    }
  }

  // Update student
  const updated = await db.queryOne(
    `UPDATE students SET
       first_name         = COALESCE($1, first_name),
       last_name          = COALESCE($2, last_name),
       date_of_birth      = COALESCE($3::DATE, date_of_birth),
       gender             = COALESCE($4::gender_type, gender),
       blood_group        = COALESCE($5, blood_group),
       category           = COALESCE($6::category_type, category),
       photo_url          = COALESCE($7, photo_url),
       previous_school    = COALESCE($8, previous_school),
       current_class_id   = COALESCE($9, current_class_id),
       current_section_id = COALESCE($10, current_section_id),
       address_line1      = COALESCE($11, address_line1),
       city               = COALESCE($12, city),
       state              = COALESCE($13, state),
       pincode            = COALESCE($14, pincode),
       updated_at         = NOW()
     WHERE id=$15 AND school_id=$16
     RETURNING *`,
    [firstName||null, lastName||null,
     dateOfBirth||null, safeGender, bloodGroup||null, safeCategory,
     photoUrl||null, previousSchool||null,
     classUUID, sectionUUID,
     addressLine1||null, city||null, state||null, pincode||null,
     req.params.id, req.schoolId]
  );
  if (!updated) throw new AppError('Student not found', 404);

  // Update primary parent
  if (parentFullName || parentPhone || parentEmail) {
    const existing = await db.queryOne(
      'SELECT id FROM student_parents WHERE student_id=$1 AND is_primary_contact=TRUE LIMIT 1',
      [req.params.id]
    );
    if (existing) {
      await db.query(
        `UPDATE student_parents SET
           full_name = COALESCE($1, full_name),
           phone     = COALESCE($2, phone),
           email     = COALESCE($3, email)
         WHERE student_id=$4 AND is_primary_contact=TRUE`,
        [parentFullName||null, parentPhone||null, parentEmail||null, req.params.id]
      );
    } else {
      await db.query(
        `INSERT INTO student_parents (student_id,relation,full_name,phone,email,is_primary_contact)
         VALUES ($1,'father',$2,$3,$4,TRUE)`,
        [req.params.id, parentFullName||'', parentPhone||'', parentEmail||null]
      );
    }
  }

  // Cascade to registration
  if (updated.registration_id) {
    await db.query(
      `UPDATE registrations SET
         student_name = COALESCE($1, student_name),
         parent_name  = COALESCE($2, parent_name),
         mobile       = COALESCE($3, mobile),
         photo_url    = COALESCE($4, photo_url),
         updated_at   = NOW()
       WHERE id=$5`,
      [firstName&&lastName ? firstName+' '+lastName : null,
       parentFullName||null, parentPhone||null, photoUrl||null,
       updated.registration_id]
    );
  }

  // Cascade to enquiry
  if (updated.enquiry_id) {
    await db.query(
      `UPDATE enquiries SET
         student_name = COALESCE($1, student_name),
         parent_name  = COALESCE($2, parent_name),
         mobile       = COALESCE($3, mobile),
         updated_at   = NOW()
       WHERE id=$4`,
      [firstName&&lastName ? firstName+' '+lastName : null,
       parentFullName||null, parentPhone||null,
       updated.enquiry_id]
    );
  }

  res.json({ success:true, data:updated, message:'Student updated. Changes synced to registration & enquiry.' });
};

// DELETE /api/students/:id
const deleteStudent = async (req, res) => {
  await db.query('SELECT deactivate_student($1,$2)', [req.params.id, req.schoolId]);
  res.json({ success: true, message: 'Student deactivated' });
};

// POST /api/students/:id/promote
const promoteStudent = async (req, res) => {
  const { newClassId, newSectionId, academicYearId } = req.body;
  const s = await db.queryOne(
    'UPDATE students SET current_class_id=$1, current_section_id=$2, academic_year_id=$3, updated_at=NOW() WHERE id=$4 AND school_id=$5 RETURNING *',
    [newClassId, newSectionId, academicYearId, req.params.id, req.schoolId]
  );
  if (!s) throw new AppError('Student not found', 404);
  res.json({ success: true, data: s });
};

// POST /api/students/:id/transport
const assignTransportRoute = async (req, res) => {
  const { routeId } = req.body;
  const rows = await db.queryAll(
    'SELECT * FROM assign_student_transport($1,$2,$3)',
    [req.params.id, req.schoolId, routeId||null]
  );
  if (!routeId) return res.json({ success: true, message: 'Transport route removed' });
  const route = rows[0];
  res.json({ success: true, data: route, message: 'Transport route assigned: ' + (route?.route_name||'') });
};

// POST /api/students/:id/confirm-admission
const confirmAdmission = async (req, res) => {
  const s = await db.queryOne(
    'UPDATE students SET admission_fee_paid=TRUE, admission_confirmed_at=NOW(), updated_at=NOW() WHERE id=$1 AND school_id=$2 RETURNING admission_no, first_name, last_name',
    [req.params.id, req.schoolId]
  );
  if (!s) throw new AppError('Student not found', 404);
  res.json({ success: true, message: s.first_name + ' ' + (s.last_name||'') + ' admission confirmed! Now visible in Students module.', data: s });
};

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, promoteStudent, assignTransportRoute, confirmAdmission };
