// Stub routes — implement controllers following same pattern as student/fee controllers

const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');

// Employee routes
const empRouter = express.Router();
empRouter.use(authenticate);
empRouter.get('/', (req, res) => res.json({ success: true, data: [], message: 'Employee list' }));
empRouter.post('/', (req, res) => res.status(201).json({ success: true, message: 'Employee created' }));
module.exports.empRouter = empRouter;

// Exam routes
const examRouter = express.Router();
examRouter.use(authenticate);
examRouter.get('/', (req, res) => res.json({ success: true, data: [] }));
examRouter.post('/marks', (req, res) => res.json({ success: true, message: 'Marks saved' }));
module.exports.examRouter = examRouter;

// Notice routes
const noticeRouter = express.Router();
noticeRouter.use(authenticate);
noticeRouter.get('/', (req, res) => res.json({ success: true, data: [] }));
noticeRouter.post('/', (req, res) => res.status(201).json({ success: true }));
module.exports.noticeRouter = noticeRouter;

// Timetable, Transport, Library, Payroll, Reports, School, Enquiry — same pattern
const stub = (req, res) => res.json({ success: true, data: [], message: 'Module ready' });
const makeRouter = () => {
  const r = express.Router();
  r.use(authenticate);
  r.get('/', stub);
  r.post('/', (req, res) => res.status(201).json({ success: true, message: 'Created' }));
  r.put('/:id', (req, res) => res.json({ success: true, message: 'Updated' }));
  r.delete('/:id', (req, res) => res.json({ success: true, message: 'Deleted' }));
  return r;
};

module.exports.timetableRouter = makeRouter();
module.exports.transportRouter = makeRouter();
module.exports.libraryRouter = makeRouter();
module.exports.payrollRouter = makeRouter();
module.exports.reportRouter = makeRouter();
module.exports.schoolRouter = makeRouter();
module.exports.enquiryRouter = makeRouter();
