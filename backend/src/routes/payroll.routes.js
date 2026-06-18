const express = require('express');
const router = express.Router();
const { getPayroll, processPayroll } = require('../controllers/payroll.controller');
const { authenticate } = require('../middleware/auth.middleware');
router.use(authenticate);
router.get('/', getPayroll);
router.post('/', processPayroll);
module.exports = router;
