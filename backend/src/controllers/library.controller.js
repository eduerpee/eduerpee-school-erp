const db = require('../config/database');
const { AppError } = require('../utils/AppError');

const getBooks = async (req, res) => {
  const { search, category, classId, page=1, limit=50 } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const rows = await db.queryAll('SELECT * FROM get_books($1,$2,$3,$4,$5,$6)',
    [req.schoolId, search||null, category||null, classId||null, parseInt(limit), offset]);
  res.json({ success:true, data:rows });
};

const addBook = async (req, res) => {
  const { title, author, isbn, publisher, edition, category, totalCopies, rackNo, classId } = req.body;
  if (!title) throw new AppError('Title required', 400);
  const copies = parseInt(totalCopies)||1;
  const book = await db.queryOne(
    `INSERT INTO books (school_id,title,author,isbn,publisher,edition,category,total_copies,available_copies,rack_no,class_id,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,$9,$10,'available'::book_status) RETURNING *, status::text as status_text`,
    [req.schoolId, title.trim(), author||null, isbn||null, publisher||null, edition||null, category||null, copies, rackNo||null, classId||null]
  );
  res.status(201).json({ success:true, data:book, message:'"'+title+'" added' });
};

const getIssues = async (req, res) => {
  const { page=1, limit=50 } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const rows = await db.queryAll('SELECT * FROM get_book_issues($1,$2,$3)',
    [req.schoolId, parseInt(limit), offset]);
  res.json({ success:true, data:rows });
};

const issueBook = async (req, res) => {
  const { bookId, studentId, dueDate } = req.body;
  if (!bookId||!studentId||!dueDate) throw new AppError('bookId, studentId and dueDate required', 400);
  const book = await db.queryOne('SELECT available_copies FROM books WHERE id=$1 AND school_id=$2', [bookId, req.schoolId]);
  if (!book)                      throw new AppError('Book not found', 404);
  if (book.available_copies <= 0) throw new AppError('No copies available', 400);
  // CALL procedure
  await db.query('CALL issue_book($1,$2,$3,$4)', [bookId, studentId, dueDate, req.user?.id||null]);
  res.status(201).json({ success:true, message:'Book issued successfully' });
};

const returnBook = async (req, res) => {
  const issue = await db.queryOne(
    `SELECT bi.return_date, bi.due_date FROM book_issues bi
     JOIN books b ON bi.book_id=b.id WHERE bi.id=$1 AND b.school_id=$2`,
    [req.params.id, req.schoolId]
  );
  if (!issue)            throw new AppError('Issue record not found', 404);
  if (issue.return_date) throw new AppError('Already returned', 400);
  const overdue = Math.max(0,Math.ceil((new Date()-new Date(issue.due_date))/86400000));
  // CALL procedure
  await db.query('CALL return_book($1,$2)', [req.params.id, req.schoolId]);
  res.json({ success:true, message:'Book returned'+(overdue>0?'. Fine: ₹'+(overdue*2):'') });
};

const getCategories = async (req, res) => {
  const rows = await db.queryAll(
    'SELECT DISTINCT category FROM books WHERE school_id=$1 AND category IS NOT NULL ORDER BY category',
    [req.schoolId]
  );
  res.json({ success:true, data:rows.map(r=>r.category) });
};

module.exports = { getBooks, addBook, getIssues, issueBook, returnBook, getCategories };
