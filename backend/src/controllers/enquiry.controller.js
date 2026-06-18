const db  = require('../config/database');
const { AppError } = require('../utils/AppError');
const { generateEnquiryNo } = require('../utils/generators');

const TO_DB   = { hot:'interested', warm:'follow_up', cold:'new', new:'new', converted:'converted', cancelled:'not_interested' };
const FROM_DB = { new:'cold', follow_up:'warm', interested:'hot', not_interested:'cold', converted:'converted' };

function toFrontend(enq) {
  if (!enq) return null;
  return { ...enq, status: FROM_DB[enq.status] || enq.status };
}

// GET /api/enquiries
const getEnquiries = async (req, res) => {
  const { page=1, limit=100, status, search } = req.query;
  const dbStatus = status ? (TO_DB[status] || status) : null;
  const offset   = (parseInt(page)-1) * parseInt(limit);

  const rows = await db.queryAll(
    'SELECT * FROM get_enquiries($1,$2,$3,$4,$5)',
    [req.schoolId, dbStatus, search||null, parseInt(limit), offset]
  );

  const total = await db.queryOne(
    `SELECT COUNT(*) FROM enquiries
     WHERE school_id=$1
       AND ($2::VARCHAR IS NULL OR status=$2::enquiry_status)
       AND ($3::VARCHAR IS NULL OR student_name ILIKE $3 OR mobile ILIKE $3 OR enquiry_no ILIKE $3 OR parent_name ILIKE $3)`,
    [req.schoolId, dbStatus, search?'%'+search+'%':null]
  );

  res.json({
    success: true,
    data:  rows.map(toFrontend),
    pagination: { total: parseInt(total?.count||0), page: parseInt(page), limit: parseInt(limit) }
  });
};

// POST /api/enquiries
const createEnquiry = async (req, res) => {
  const { studentName, parentName, mobile, email, classInterested, source, remarks, status } = req.body;
  if (!studentName || !mobile) throw new AppError('Student name and mobile are required', 400);

  const dbStatus  = TO_DB[status] || 'new';
  const enquiryNo = await generateEnquiryNo(req.schoolId);

  const enq = await db.queryOne(
    'SELECT * FROM create_enquiry($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [req.schoolId, enquiryNo, studentName, parentName||'', mobile,
     email||null, classInterested||null, source||'walk_in', remarks||null, dbStatus]
  );

  res.status(201).json({
    success: true,
    data: toFrontend(enq),
    message: 'Enquiry ' + enquiryNo + ' saved to database'
  });
};

// PUT /api/enquiries/:id
const updateEnquiry = async (req, res) => {
  const existing = await db.queryOne(
    'SELECT status FROM enquiries WHERE id=$1 AND school_id=$2',
    [req.params.id, req.schoolId]
  );
  if (!existing) throw new AppError('Enquiry not found', 404);
  if (existing.status === 'converted') throw new AppError('Cannot edit a converted enquiry', 400);

  const { studentName, parentName, mobile, email, classInterested, source, remarks, status, followUpDate } = req.body;
  const dbStatus = status ? (TO_DB[status] || status) : null;

  const enq = await db.queryOne(
    'SELECT * FROM update_enquiry($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [req.params.id, req.schoolId,
     studentName||null, parentName||null, mobile||null, email||null,
     classInterested||null, source||null, remarks||null,
     dbStatus, followUpDate||null]
  );

  res.json({ success: true, data: toFrontend(enq), message: 'Enquiry updated' });
};

module.exports = { getEnquiries, createEnquiry, updateEnquiry };
