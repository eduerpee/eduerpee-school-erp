const db = require('../config/database');
const { AppError } = require('../utils/AppError');
const { generateEmployeeId } = require('../utils/generators');

function mapType(t) {
  const m = { teaching:'teaching', non_teaching:'non_teaching', administrative:'administrative',
    teacher:'teacher', accountant:'accountant', admin:'admin', driver:'driver',
    librarian:'librarian', principal:'principal', security:'security', peon:'peon' };
  return m[t]||'teacher';
}

const getEmployees = async (req, res) => {
  const { page=1, limit=50, search, employeeType } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);

  const rows = await db.queryAll(
    `SELECT e.id, e.employee_id, e.first_name, e.last_name,
            e.employee_type::TEXT as employee_type,
            e.department, e.designation, e.phone, e.email,
            e.joining_date::DATE as joining_date,
            e.qualification::TEXT as qualification,
            e.is_active,
            COALESCE(ss.basic_salary, 0) as basic_salary
     FROM employees e
     LEFT JOIN LATERAL (
       SELECT basic_salary FROM salary_structures
       WHERE employee_id=e.id ORDER BY effective_from DESC LIMIT 1
     ) ss ON TRUE
     WHERE e.school_id=$1
       AND ($2::VARCHAR IS NULL OR e.first_name ILIKE $2 OR e.last_name ILIKE $2 OR e.employee_id ILIKE $2)
       AND ($3::VARCHAR IS NULL OR e.employee_type::TEXT=$3)
     ORDER BY e.created_at DESC
     LIMIT $4 OFFSET $5`,
    [req.schoolId,
     search ? '%'+search+'%' : null,
     employeeType || null,
     parseInt(limit), offset]
  );

  res.json({ success:true, data:rows, pagination:{page:parseInt(page),limit:parseInt(limit)} });
};

const getEmployee = async (req, res) => {
  const emp = await db.queryOne(
    `SELECT e.*, e.employee_type::text as employee_type, COALESCE(ss.basic_salary,0) as basic_salary
     FROM employees e
     LEFT JOIN LATERAL (SELECT basic_salary FROM salary_structures WHERE employee_id=e.id ORDER BY effective_from DESC LIMIT 1) ss ON TRUE
     WHERE e.id=$1 AND e.school_id=$2`,
    [req.params.id, req.schoolId]
  );
  if (!emp) throw new AppError('Employee not found', 404);
  res.json({ success:true, data:emp });
};

const createEmployee = async (req, res) => {
  const { firstName, lastName, employeeType, department, designation,
    phone, email, joiningDate, basicSalary, qualification, aadhaarNo, panNo, address } = req.body;
  if (!firstName?.trim()) throw new AppError('First name required', 400);
  if (!phone?.trim())     throw new AppError('Phone required', 400);
  if (!employeeType)      throw new AppError('Employee type required', 400);
  const dbType = mapType(employeeType);
  const empId  = await generateEmployeeId(req.schoolId);
  const today  = new Date().toISOString().split('T')[0];
  let created;
  await db.transaction(async (client) => {
    const r = await client.query(
      `INSERT INTO employees (school_id,employee_id,first_name,last_name,employee_type,department,designation,phone,email,joining_date,qualification,aadhaar_no,pan_no,address,is_active)
       VALUES ($1,$2,$3,$4,$5::employee_type,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE)
       RETURNING *, employee_type::text as employee_type`,
      [req.schoolId, empId, firstName.trim(), (lastName||'').trim(), dbType,
       department||null, designation||null, phone.trim(), email||null,
       joiningDate||today, qualification||null, aadhaarNo||null, panNo||null, address||null]
    );
    created = r.rows[0];
    const sal = parseFloat(basicSalary)||0;
    if (sal>0) await client.query(
      `INSERT INTO salary_structures (school_id,employee_id,basic_salary,effective_from) VALUES ($1,$2,$3,$4::date)`,
      [req.schoolId, created.id, sal, today]
    );
  });
  res.status(201).json({ success:true, data:{...created,basic_salary:parseFloat(basicSalary)||0}, message:'Employee '+empId+' saved ✅' });
};

const updateEmployee = async (req, res) => {
  const { firstName, lastName, department, designation, phone, email, isActive, basicSalary, qualification } = req.body;
  // CALL procedure for DML
  await db.query('CALL update_employee_record($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [req.params.id, req.schoolId, firstName||null, lastName||null,
     department||null, designation||null, phone||null, email||null,
     isActive!==undefined?isActive:null, qualification||null]);
  if (basicSalary!==undefined && parseFloat(basicSalary)>=0) {
    const today = new Date().toISOString().split('T')[0];
    await db.query(`INSERT INTO salary_structures (school_id,employee_id,basic_salary,effective_from) VALUES ($1,$2,$3,$4::date)`,
      [req.schoolId, req.params.id, parseFloat(basicSalary)||0, today]);
  }
  const emp = await db.queryOne(
    `SELECT e.*, e.employee_type::text as employee_type FROM employees e WHERE e.id=$1 AND e.school_id=$2`,
    [req.params.id, req.schoolId]
  );
  res.json({ success:true, data:emp, message:'Employee updated ✅' });
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee };
