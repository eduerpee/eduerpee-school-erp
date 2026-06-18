const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/school.controller');
const { authenticate } = require('../middleware/auth.middleware');
router.use(authenticate);
router.get('/profile',        ctrl.getSchool);
router.put('/profile',        ctrl.updateSchool);
router.get('/classes',        ctrl.getClasses);
router.post('/classes',       ctrl.addClass);
router.get('/sections',       ctrl.getSections);
router.get('/subjects',       ctrl.getSubjects);
router.post('/subjects',      ctrl.addSubject);      // NEW
router.get('/academic-years', ctrl.getAcademicYears);
module.exports = router;
