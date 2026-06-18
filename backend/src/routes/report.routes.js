const express = require('express');
const router = express.Router();
const { getFeeSummary, getAttendanceSummary, getStudentStrength } = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
router.use(authenticate);
router.get('/fee-summary', getFeeSummary);
router.get('/attendance-summary', getAttendanceSummary);
router.get('/student-strength', getStudentStrength);
module.exports = router;
