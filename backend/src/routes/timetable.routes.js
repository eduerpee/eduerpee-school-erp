const express = require('express');
const router  = express.Router();
const { getTimetable, saveTimetable, deleteTimetableSlot } = require('../controllers/timetable.controller');
const { authenticate } = require('../middleware/auth.middleware');
router.use(authenticate);
router.get('/',    getTimetable);
router.post('/',   saveTimetable);
router.delete('/:id', deleteTimetableSlot);
module.exports = router;
