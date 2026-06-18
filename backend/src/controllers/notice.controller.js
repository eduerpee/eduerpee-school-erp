const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const getNotices = async (req, res) => {
  const { page=1, limit=20, type } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const rows = await db.queryAll('SELECT * FROM get_notices($1,$2,$3,$4)',
    [req.schoolId, type||null, parseInt(limit), offset]);
  res.json({ success:true, data:rows });
};

const createNotice = async (req, res) => {
  const { title, content, noticeType, expiryDate } = req.body;
  if (!title||!content) throw new AppError('Title and content required', 400);
  // CALL procedure
  await db.query('CALL publish_notice($1,$2,$3,$4,$5,$6)',
    [req.schoolId, title, content, noticeType||'general', expiryDate||null, req.user.id]);
  const notice = await db.queryOne(
    'SELECT * FROM notices WHERE school_id=$1 AND title=$2 ORDER BY created_at DESC LIMIT 1',
    [req.schoolId, title]
  );
  res.status(201).json({ success:true, data:notice });
};


const updateNotice = async (req, res) => {
  const { title, content, noticeType, expiryDate } = req.body;
  const notice = await db.queryOne(
    `UPDATE notices SET
       title       = COALESCE($1, title),
       content     = COALESCE($2, content),
       notice_type = COALESCE($3::notice_type, notice_type),
       expiry_date = $4,
       updated_at  = NOW()
     WHERE id=$5 AND school_id=$6
     RETURNING *`,
    [title||null, content||null, noticeType||null, expiryDate||null,
     req.params.id, req.schoolId]
  );
  if (!notice) throw new AppError('Notice not found', 404);
  res.json({ success:true, data:notice, message:'Notice updated' });
};

const deleteNotice = async (req, res) => {
  // CALL procedure
  await db.query('CALL remove_notice($1,$2)', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Notice removed' });
};

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };
