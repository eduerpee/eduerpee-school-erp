const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/registration.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',              ctrl.getRegistrations);
router.post('/',             ctrl.createRegistration);
router.put('/:id',           ctrl.updateRegistration);
router.delete('/:id',        ctrl.deleteRegistration);
router.post('/:id/convert',  ctrl.convertToStudent);

module.exports = router;
