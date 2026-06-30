const express = require('express');
const ctrl = require('../controllers/propertiesController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { validateRequest, validateObjectId } = require('../middleware/validate');
const { createPropertyRules, updatePropertyRules } = require('../validators/propertyValidators');

const router = express.Router();
router.use(authenticateJWT, enforceWorkspace);

router.get('/', ctrl.list);
router.post('/', createPropertyRules, validateRequest, ctrl.create);
router.get('/:id', validateObjectId(), ctrl.getOne);
router.put('/:id', validateObjectId(), updatePropertyRules, validateRequest, ctrl.update);
router.delete('/:id', validateObjectId(), requireRole('admin'), ctrl.remove);

module.exports = router;
