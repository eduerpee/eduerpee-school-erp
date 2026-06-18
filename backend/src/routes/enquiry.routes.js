const express = require('express');
const router = express.Router();
const { getEnquiries, createEnquiry, updateEnquiry } = require('../controllers/enquiry.controller');
const { authenticate } = require('../middleware/auth.middleware');
router.use(authenticate);
router.get('/', getEnquiries);
router.post('/', createEnquiry);
router.put('/:id', updateEnquiry);
module.exports = router;
