const db = require('../config/database');

const getPayroll = async (req,res) => {
  const { monthYear } = req.query;
  const rows = await db.queryAll(`SELECT p.*, e.first_name, e.last_name, e.employee_id, e.employee_type, e.department FROM payroll p JOIN employees e ON p.employee_id=e.id WHERE p.school_id=$1 AND ($2::text IS NULL OR p.month_year=$2) ORDER BY p.month_year DESC, e.first_name`,[req.schoolId, monthYear||null]);
  res.json({ success: true, data: rows });
};

const processPayroll = async (req,res) => {
  const { employeeId, monthYear, grossSalary, totalDeductions, netSalary, paymentMode } = req.body;
  const payroll = await db.queryOne(
    `INSERT INTO payroll (school_id, employee_id, month_year, gross_salary, total_deductions, net_salary, payment_mode, payment_status, processed_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8) ON CONFLICT (employee_id, month_year) DO UPDATE SET net_salary=EXCLUDED.net_salary, payment_status='processed' RETURNING *`,
    [req.schoolId, employeeId, monthYear, grossSalary, totalDeductions, netSalary, paymentMode, req.user.id]
  );
  res.status(201).json({ success: true, data: payroll });
};

module.exports = { getPayroll, processPayroll };
