const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const getCategories = async (req, res) => {
  const cats = await db.queryAll('SELECT * FROM expense_categories WHERE school_id=$1 ORDER BY name', [req.schoolId]);
  res.json({ success:true, data:cats });
};

const addCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new AppError('Category name required', 400);
  const existing = await db.queryOne('SELECT * FROM expense_categories WHERE school_id=$1 AND LOWER(name)=LOWER($2)', [req.schoolId, name.trim()]);
  if (existing) return res.json({ success:true, data:existing, message:'Category already exists' });
  const cat = await db.queryOne('INSERT INTO expense_categories (school_id,name,description) VALUES ($1,$2,$3) RETURNING *', [req.schoolId, name.trim(), description||null]);
  res.status(201).json({ success:true, data:cat, message:'Category "'+name+'" added' });
};

const getExpenses = async (req, res) => {
  const { page=1, limit=50, categoryId, month, year } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const rows = await db.queryAll('SELECT * FROM get_expenses($1,$2,$3,$4,$5,$6)',
    [req.schoolId, categoryId||null, month?parseInt(month):null, year?parseInt(year):null, parseInt(limit), offset]);
  res.json({ success:true, data:rows });
};

const addExpense = async (req, res) => {
  const { title, amount, expenseDate, categoryId, paymentMode, vendorName, invoiceNo, remarks } = req.body;
  if (!title||!amount||!expenseDate) throw new AppError('Title, amount and date required', 400);
  // CALL procedure
  await db.query('CALL add_expense($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [req.schoolId, title, parseFloat(amount), expenseDate, categoryId||null,
     paymentMode||'cash', vendorName||null, invoiceNo||null, remarks||null, req.user?.id||null]);
  res.status(201).json({ success:true, message:'Expense saved' });
};

const deleteExpense = async (req, res) => {
  await db.query('DELETE FROM expenses WHERE id=$1 AND school_id=$2', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Expense deleted' });
};

const getSummary = async (req, res) => {
  const y = parseInt(req.query.year)||new Date().getFullYear();
  const row = await db.queryOne('SELECT * FROM get_expense_summary($1,$2)', [req.schoolId, y]);
  res.json({
    success:true,
    data: { monthly: row?.monthly||[], byCategory: row?.by_category||[], totalYear: row?.total_year||0, year:y }
  });
};

module.exports = { getCategories, addCategory, getExpenses, addExpense, deleteExpense, getSummary };
