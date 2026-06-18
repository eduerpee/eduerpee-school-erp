const db  = require('../config/database');
const { AppError } = require('../utils/AppError');

// ── FEE TYPES ─────────────────────────────────────────────────

const getFeeTypes = async (req, res) => {
  const rows = await db.queryAll(
    `SELECT ft.id, ft.name, ft.code, ft.description, ft.is_recurring,
            ft.frequency::TEXT as frequency, ft.is_active
     FROM fee_types ft
     WHERE ft.school_id=$1 AND ft.is_active=TRUE ORDER BY ft.name`,
    [req.schoolId]
  );
  res.json({ success:true, data:rows });
};

const createFeeType = async (req, res) => {
  const { name, code, description, isRecurring, frequency } = req.body;
  if (!name) throw new AppError('Fee type name required', 400);
  const existing = await db.queryOne(
    'SELECT id FROM fee_types WHERE school_id=$1 AND LOWER(name)=LOWER($2)',
    [req.schoolId, name.trim()]
  );
  if (existing) throw new AppError('Fee type "' + name + '" already exists', 409);
  const row = await db.queryOne(
    `INSERT INTO fee_types (school_id,name,code,description,is_recurring,frequency,is_active)
     VALUES ($1,$2,$3,$4,$5,$6::fee_frequency,TRUE) RETURNING *, frequency::TEXT as frequency`,
    [req.schoolId, name.trim(), code||null, description||null,
     isRecurring!==false, frequency||'monthly']
  );
  res.status(201).json({ success:true, data:row, message:'Fee type "'+name+'" created' });
};

const updateFeeType = async (req, res) => {
  const { name, code, description, isRecurring, frequency, isActive } = req.body;
  const row = await db.queryOne(
    `UPDATE fee_types SET
       name        = COALESCE($1, name),
       code        = COALESCE($2, code),
       description = COALESCE($3, description),
       is_recurring= COALESCE($4, is_recurring),
       frequency   = COALESCE($5::fee_frequency, frequency),
       is_active   = COALESCE($6, is_active)
     WHERE id=$7 AND school_id=$8
     RETURNING *, frequency::TEXT as frequency`,
    [name||null, code||null, description||null,
     isRecurring!==undefined?isRecurring:null,
     frequency||null, isActive!==undefined?isActive:null,
     req.params.id, req.schoolId]
  );
  if (!row) throw new AppError('Fee type not found', 404);
  res.json({ success:true, data:row });
};

const deleteFeeType = async (req, res) => {
  await db.query('UPDATE fee_types SET is_active=FALSE WHERE id=$1 AND school_id=$2',
    [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Fee type deactivated' });
};

// ── FEE STRUCTURE ─────────────────────────────────────────────

const getFeeStructure = async (req, res) => {
  const { classId, className } = req.query;
  const rows = await db.queryAll(
    `SELECT fs.id, fs.school_id, fs.academic_year_id, fs.class_id,
            fs.fee_type_id, fs.amount, fs.due_date, fs.late_fee_per_day,
            ft.name as fee_type_name, ft.code,
            ft.frequency::TEXT as frequency, ft.is_recurring,
            c.name as class_name
     FROM fee_structures fs
     JOIN fee_types ft ON fs.fee_type_id=ft.id
     JOIN classes   c  ON fs.class_id=c.id
     WHERE fs.school_id=$1
       AND ($2::UUID IS NULL OR fs.class_id=$2)
       AND ($3::VARCHAR IS NULL OR c.name=$3)
       AND ft.is_active=TRUE
     ORDER BY ft.name`,
    [req.schoolId, classId||null, className||null]
  );
  res.json({ success:true, data:rows });
};

const saveFeeStructure = async (req, res) => {
  const { classId, structures } = req.body;
  if (!classId || !structures?.length) throw new AppError('classId and structures required', 400);
  const ay = await db.queryOne(
    'SELECT id FROM academic_years WHERE school_id=$1 AND is_current=TRUE LIMIT 1',
    [req.schoolId]
  );
  const saved = [];
  for (const s of structures) {
    const updated = await db.queryOne(
      `UPDATE fee_structures SET amount=$1, due_date=$2, late_fee_per_day=$3
       WHERE school_id=$4 AND class_id=$5 AND fee_type_id=$6 RETURNING *`,
      [parseFloat(s.amount)||0, parseInt(s.dueDate)||10, parseFloat(s.lateFeePerDay)||0,
       req.schoolId, classId, s.feeTypeId]
    );
    if (updated) { saved.push(updated); continue; }
    const inserted = await db.queryOne(
      `INSERT INTO fee_structures
         (school_id, academic_year_id, class_id, fee_type_id, amount, due_date, late_fee_per_day)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.schoolId, ay?.id||null, classId, s.feeTypeId,
       parseFloat(s.amount)||0, parseInt(s.dueDate)||10, parseFloat(s.lateFeePerDay)||0]
    );
    if (inserted) saved.push(inserted);
  }
  res.json({ success:true, data:saved, message:saved.length+' fee heads saved' });
};

const deleteFeeStructure = async (req, res) => {
  await db.query('DELETE FROM fee_structures WHERE id=$1 AND school_id=$2',
    [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Fee structure removed' });
};

// ── STUDENT FEES ──────────────────────────────────────────────

const getStudentFees = async (req, res) => {
  // First sync paid_amount in student_fees from actual fee_payments
  await db.query(
    `UPDATE student_fees sf SET
       paid_amount = COALESCE((
         SELECT SUM(fp.amount) FROM fee_payments fp
         WHERE fp.student_fee_id=sf.id AND fp.is_cancelled=FALSE
       ),0),
       status = CASE
         WHEN COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.student_fee_id=sf.id AND fp.is_cancelled=FALSE),0) >= sf.amount THEN 'paid'::fee_status
         WHEN COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.student_fee_id=sf.id AND fp.is_cancelled=FALSE),0) > 0 THEN 'partial'::fee_status
         ELSE 'pending'::fee_status
       END
     WHERE sf.student_id=$1 AND sf.school_id=$2`,
    [req.params.studentId, req.schoolId]
  );

  const rows = await db.queryAll(
    `SELECT sf.id, sf.student_id, sf.fee_type_id, sf.amount,
            sf.paid_amount, sf.status::TEXT as status,
            sf.due_date, sf.academic_year_id,
            ft.name as fee_type_name, ft.frequency::TEXT as frequency,
            (sf.amount - COALESCE(sf.paid_amount,0)) as balance
     FROM student_fees sf
     JOIN fee_types ft ON sf.fee_type_id=ft.id
     WHERE sf.student_id=$1 AND sf.school_id=$2
     ORDER BY sf.due_date DESC`,
    [req.params.studentId, req.schoolId]
  );
  res.json({ success:true, data:rows });
};

// ── FEE COLLECTION ────────────────────────────────────────────

const collectFee = async (req, res) => {
  const { studentId, feeTypeId, amount, paymentMode, remarks, transactionId, paymentDate, feeMonth } = req.body;
  if (!studentId || !amount || !paymentMode)
    throw new AppError('studentId, amount and paymentMode required', 400);

  // Build remarks with fee month
  const fullRemarks = [feeMonth?'Month: '+feeMonth:null, remarks||null].filter(Boolean).join(' | ') || null;

  const payment = await db.queryOne(
    'SELECT * FROM collect_fee($1,$2,$3,$4,$5,$6,$7,$8)',
    [req.schoolId, studentId, feeTypeId||null, parseFloat(amount),
     paymentMode, transactionId||null, fullRemarks, req.user?.id||null]
  );

  // Update payment_date if custom date provided
  if (paymentDate && payment?.id) {
    await db.query('UPDATE fee_payments SET payment_date=$1 WHERE id=$2', [paymentDate, payment.id]);
    payment.payment_date = paymentDate;
  }

  // Auto-confirm admission on first fee payment
  const student = await db.queryOne(
    'SELECT admission_fee_paid FROM students WHERE id=$1 AND school_id=$2',
    [studentId, req.schoolId]
  );
  if (student && !student.admission_fee_paid) {
    await db.query(
      'UPDATE students SET admission_fee_paid=TRUE, admission_confirmed_at=NOW(), updated_at=NOW() WHERE id=$1 AND school_id=$2',
      [studentId, req.schoolId]
    );
  }

  res.status(201).json({
    success:true, data:payment,
    message:'Payment collected. Receipt: '+payment.receipt_no,
    admissionConfirmed: student && !student.admission_fee_paid
  });
};

const getCollectionReport = async (req, res) => {
  const y = parseInt(req.query.year)  || new Date().getFullYear();
  const m = parseInt(req.query.month) || (new Date().getMonth()+1);
  const classId = req.query.classId || null;
  const rows = await db.queryAll(
    `SELECT fp.id, fp.amount, fp.payment_date, fp.payment_mode::TEXT as payment_mode,
            fp.receipt_no, fp.transaction_id, fp.remarks,
            s.admission_no, s.first_name, s.last_name,
            ft.name as fee_type_name, c.name as class_name
     FROM fee_payments fp
     JOIN student_fees sf ON fp.student_fee_id=sf.id
     JOIN students    s  ON sf.student_id=s.id
     JOIN fee_types   ft ON sf.fee_type_id=ft.id
     LEFT JOIN classes c ON s.current_class_id=c.id
     WHERE fp.school_id=$1
       AND EXTRACT(YEAR  FROM fp.payment_date)=$2
       AND EXTRACT(MONTH FROM fp.payment_date)=$3
       AND fp.is_cancelled=FALSE
       AND ($4::UUID IS NULL OR s.current_class_id=$4)
     ORDER BY fp.payment_date DESC`,
    [req.schoolId, y, m, classId]
  );
  const total = rows.reduce((s,r)=>s+parseFloat(r.amount),0);
  res.json({ success:true, data:rows, total });
};

const getPendingFees = async (req, res) => {
  const classId = req.query.classId || null;

  // 1. Students with existing student_fees records (pending/partial)
  const withRecords = await db.queryAll(
    `SELECT sf.id, sf.student_id, sf.fee_type_id,
            sf.amount, sf.status::TEXT as status,
            COALESCE(sf.paid_amount,0) as paid_amount,
            s.admission_no,
            COALESCE(s.first_name, split_part(r.student_name,' ',1), 'Unknown') as first_name,
            COALESCE(s.last_name, TRIM(SUBSTRING(r.student_name FROM POSITION(' ' IN r.student_name))), '') as last_name,
            ft.name as fee_type_name,
            c.name as class_name,
            sp.phone as parent_phone
     FROM student_fees sf
     JOIN students  s  ON sf.student_id = s.id
     LEFT JOIN registrations r ON s.registration_id = r.id
     JOIN fee_types ft ON sf.fee_type_id = ft.id
     LEFT JOIN classes c ON s.current_class_id = c.id
     LEFT JOIN student_parents sp ON sp.student_id=s.id AND sp.is_primary_contact=TRUE
     WHERE sf.school_id = $1
       AND sf.status IN ('pending','partial')
       AND s.is_active = TRUE
       AND ($2::UUID IS NULL OR s.current_class_id = $2)
       -- Skip Transportation fee if student has no route assigned
       AND (
         LOWER(ft.name) NOT LIKE '%transport%'
         OR EXISTS (
           SELECT 1 FROM student_transport st WHERE st.student_id = s.id
         )
       )
     ORDER BY c.name, s.first_name`,
    [req.schoolId, classId]
  );

  // 2. Students who have fee structure but ZERO student_fees records for that fee type
  const withoutRecords = await db.queryAll(
    `SELECT NULL::UUID as id,
            s.id as student_id,
            ft.id as fee_type_id,
            fs.amount,
            'pending'::TEXT as status,
            0::NUMERIC as paid_amount,
            s.admission_no, s.first_name, s.last_name,
            ft.name as fee_type_name,
            c.name as class_name,
            sp.phone as parent_phone
     FROM students s
     JOIN classes c ON s.current_class_id = c.id
     JOIN fee_structures fs ON fs.class_id = c.id AND fs.school_id = $1
     JOIN fee_types ft ON ft.id = fs.fee_type_id AND ft.is_active = TRUE
     LEFT JOIN student_parents sp ON sp.student_id=s.id AND sp.is_primary_contact=TRUE
     WHERE s.school_id = $1
       AND s.is_active = TRUE
       AND ($2::UUID IS NULL OR s.current_class_id = $2)
       AND NOT EXISTS (
         SELECT 1 FROM student_fees sf2
         WHERE sf2.student_id = s.id AND sf2.fee_type_id = ft.id
       )
       -- Skip Transportation fee if student has no route assigned
       AND (
         LOWER(ft.name) NOT LIKE '%transport%'
         OR EXISTS (
           SELECT 1 FROM student_transport st
           WHERE st.student_id = s.id
         )
       )
     ORDER BY c.name, s.first_name`,
    [req.schoolId, classId]
  );

  // Merge and sort
  const all = [...withRecords, ...withoutRecords];
  all.sort((a,b) => (a.class_name||'').localeCompare(b.class_name||'') || (a.first_name||'').localeCompare(b.first_name||''));

  res.json({ success:true, data: all });
};

module.exports = {
  getFeeTypes, createFeeType, updateFeeType, deleteFeeType,
  getFeeStructure, saveFeeStructure, deleteFeeStructure,
  getStudentFees, collectFee, getCollectionReport, getPendingFees
};
