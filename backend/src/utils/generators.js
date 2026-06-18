// utils/generators.js
const db = require('../config/database');

const generateAdmissionNo = async (schoolId) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await db.queryOne(
    `SELECT COUNT(*) as cnt FROM students WHERE school_id = $1 AND EXTRACT(YEAR FROM admission_date) = EXTRACT(YEAR FROM NOW())`,
    [schoolId]
  );
  const seq = (parseInt(count.cnt) + 1).toString().padStart(4, '0');
  return `ADM${year}${seq}`;
};

const generateReceiptNo = async (schoolId) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const count = await db.queryOne(
    `SELECT COUNT(*) as cnt FROM fee_payments WHERE school_id = $1 AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM NOW())`,
    [schoolId]
  );
  const seq = (parseInt(count.cnt) + 1).toString().padStart(5, '0');
  return `REC${year}${month}${seq}`;
};

const generateEmployeeId = async (schoolId) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await db.queryOne(
    `SELECT COUNT(*) as cnt FROM employees WHERE school_id = $1`,
    [schoolId]
  );
  const seq = (parseInt(count.cnt) + 1).toString().padStart(4, '0');
  return `EMP${year}${seq}`;
};

const generateEnquiryNo = async (schoolId) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const count = await db.queryOne(
    `SELECT COUNT(*) as cnt FROM enquiries WHERE school_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
    [schoolId]
  );
  const seq = (parseInt(count.cnt) + 1).toString().padStart(4, '0');
  return `ENQ${year}${seq}`;
};

module.exports = { generateAdmissionNo, generateReceiptNo, generateEmployeeId, generateEnquiryNo };
