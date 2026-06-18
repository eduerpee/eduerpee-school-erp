const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const getTCs = async (req, res) => {
  const rows = await db.queryAll('SELECT * FROM get_transfer_certificates($1)', [req.schoolId]);
  res.json({ success:true, data:rows });
};

const createTC = async (req, res) => {
  const { studentId, leavingDate, leavingClass, reason, conduct,
          lastExamClass, lastExamYear, lastExamResult, feePaid, remarks } = req.body;
  if (!studentId) throw new AppError('studentId required', 400);
  await db.query('CALL create_transfer_certificate($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    [req.schoolId, studentId,
     leavingDate||null, leavingClass||null,
     reason||"Parent's request", conduct||'Good',
     lastExamClass||null, lastExamYear||null, lastExamResult||'Passed',
     feePaid!==false, remarks||null, req.user?.id||null]);
  // Return the created TC
  const all = await db.queryAll('SELECT * FROM get_transfer_certificates($1)', [req.schoolId]);
  res.status(201).json({ success:true, data:all[0], message:'TC issued successfully' });
};

const updateTC = async (req, res) => {
  const { leavingDate, reason, conduct, remarks, status } = req.body;
  await db.query('CALL update_transfer_certificate($1,$2,$3,$4,$5,$6,$7)',
    [req.params.id, req.schoolId,
     leavingDate||null, reason||null, conduct||null, remarks||null, status||null]);
  res.json({ success:true, message:'TC updated' });
};

const deleteTC = async (req, res) => {
  await db.query('CALL delete_transfer_certificate($1,$2)', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'TC deleted' });
};

module.exports = { getTCs, createTC, updateTC, deleteTC };
