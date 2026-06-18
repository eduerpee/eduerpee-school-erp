const db = require('../config/database');
const { AppError } = require('../utils/AppError');

// GET /api/schools/profile
const getSchool = async (req, res) => {
  const school = await db.queryOne('SELECT * FROM schools WHERE id=$1', [req.schoolId]);
  if (!school) throw new AppError('School not found', 404);
  res.json({ success: true, data: school });
};

// PUT /api/schools/profile
const updateSchool = async (req, res) => {
  const {
    name, tagline, address, city, state, pincode,
    phone, altPhone, email, website,
    principalName, affiliationNo, establishedYear,
    logoUrl, primaryColor, accentColor
  } = req.body;

  // Store extra fields (tagline, altPhone, colors) in settings JSONB
  const existingSchool = await db.queryOne('SELECT settings FROM schools WHERE id=$1', [req.schoolId]);
  const existing = existingSchool?.settings || {};
  const newSettings = {
    ...existing,
    tagline:      tagline      || existing.tagline      || '',
    altPhone:     altPhone     || existing.altPhone     || '',
    primaryColor: primaryColor || existing.primaryColor || '#1E1B4B',
    accentColor:  accentColor  || existing.accentColor  || '#F59E0B',
  };

  const school = await db.queryOne(
    `UPDATE schools
     SET name             = COALESCE($1, name),
         address          = COALESCE($2, address),
         city             = COALESCE($3, city),
         state            = COALESCE($4, state),
         pincode          = COALESCE($5, pincode),
         phone            = COALESCE($6, phone),
         email            = COALESCE($7, email),
         website          = COALESCE($8, website),
         principal_name   = COALESCE($9, principal_name),
         affiliation_no   = COALESCE($10, affiliation_no),
         established_year = COALESCE($11, established_year),
         logo_url         = COALESCE($12, logo_url),
         settings         = $13,
         updated_at       = NOW()
     WHERE id = $14
     RETURNING *`,
    [
      name          || null,
      address       || null,
      city          || null,
      state         || null,
      pincode       || null,
      phone         || null,
      email         || null,
      website       || null,
      principalName || null,
      affiliationNo || null,
      establishedYear ? parseInt(establishedYear) : null,
      logoUrl       || null,
      JSON.stringify(newSettings),
      req.schoolId,
    ]
  );

  res.json({ success: true, data: school, message: 'School profile updated successfully' });
};

// GET /api/schools/classes
const getClasses = async (req, res) => {
  const classes = await db.queryAll(
    `SELECT c.id, c.name, c.numeric_level, c.is_active,
            COUNT(s.id) as student_count
     FROM classes c
     LEFT JOIN students s ON s.current_class_id=c.id AND s.is_active=TRUE
     WHERE c.school_id=$1 AND c.is_active=TRUE
     GROUP BY c.id, c.name, c.numeric_level, c.is_active
     ORDER BY c.numeric_level NULLS LAST, c.name`,
    [req.schoolId]
  );

  // De-duplicate by name keeping the one with most students
  const seen = new Map();
  for (const cls of classes) {
    const existing = seen.get(cls.name);
    if (!existing || parseInt(cls.student_count) > parseInt(existing.student_count)) {
      seen.set(cls.name, cls);
    }
  }
  res.json({ success: true, data: Array.from(seen.values()) });
};

// POST /api/schools/classes
const addClass = async (req, res) => {
  const { name, numericLevel, description } = req.body;
  if (!name) throw new AppError('Class name is required', 400);

  const existing = await db.queryOne(
    'SELECT id FROM classes WHERE school_id=$1 AND name=$2 LIMIT 1',
    [req.schoolId, name.trim()]
  );
  if (existing) throw new AppError('Class "' + name + '" already exists', 409);

  const level = numericLevel || parseInt((name.match(/\d+/) || [0])[0]) || 0;

  const cls = await db.queryOne(
    `INSERT INTO classes (school_id, name, numeric_level, description, is_active)
     VALUES ($1,$2,$3,$4,TRUE) RETURNING *`,
    [req.schoolId, name.trim(), level, description || null]
  );

  // Create default Section A
  await db.query(
    `INSERT INTO sections (class_id, school_id, name, is_active)
     VALUES ($1,$2,'A',TRUE) ON CONFLICT DO NOTHING`,
    [cls.id, req.schoolId]
  );

  res.status(201).json({
    success: true, data: cls,
    message: 'Class "' + name + '" created with Section A'
  });
};

// GET /api/schools/sections
const getSections = async (req, res) => {
  const sections = await db.queryAll(
    `SELECT sec.*, c.name as class_name FROM sections sec
     JOIN classes c ON sec.class_id = c.id
     WHERE sec.school_id=$1 AND ($2::uuid IS NULL OR sec.class_id=$2) AND sec.is_active=TRUE
     ORDER BY c.numeric_level, sec.name`,
    [req.schoolId, req.query.classId || null]
  );
  res.json({ success: true, data: sections });
};

// GET /api/schools/subjects
const getSubjects = async (req, res) => {
  const subjects = await db.queryAll(
    'SELECT * FROM subjects WHERE school_id=$1 AND is_active=TRUE ORDER BY name',
    [req.schoolId]
  );
  res.json({ success: true, data: subjects });
};

// POST /api/schools/subjects
const addSubject = async (req, res) => {
  const { name, code, description } = req.body;
  if (!name) throw new AppError('Subject name is required', 400);

  const existing = await db.queryOne(
    'SELECT id FROM subjects WHERE school_id=$1 AND LOWER(name)=LOWER($2) LIMIT 1',
    [req.schoolId, name.trim()]
  );
  if (existing) throw new AppError('Subject "' + name + '" already exists', 409);

  const subject = await db.queryOne(
    `INSERT INTO subjects (school_id, name, code, description, is_active)
     VALUES ($1,$2,$3,$4,TRUE) RETURNING *`,
    [req.schoolId, name.trim(), code||null, description||null]
  );
  res.status(201).json({ success: true, data: subject, message: 'Subject "' + name + '" added' });
};

// GET /api/schools/academic-years
const getAcademicYears = async (req, res) => {
  const years = await db.queryAll(
    'SELECT * FROM academic_years WHERE school_id=$1 ORDER BY start_date DESC',
    [req.schoolId]
  );
  res.json({ success: true, data: years });
};

module.exports = { getSchool, updateSchool, getClasses, addClass, getSections, getSubjects, addSubject, getAcademicYears };
