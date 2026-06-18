// routes/attendance.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.post('/student/mark', ctrl.markStudentAttendance);
router.get('/student/class', ctrl.getClassAttendance);
router.get('/student/:studentId/monthly', ctrl.getStudentMonthlyAttendance);
router.get('/report', ctrl.getAttendanceReport);

module.exports = router;
