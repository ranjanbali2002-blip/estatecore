const express = require('express');
const ctrl = require('../controllers/leadsController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { checkPlanFeature } = require('../middleware/planGate');
const { validateRequest, validateObjectId } = require('../middleware/validate');
const {
  createLeadRules,
  updateLeadRules,
  noteRules,
  callLogRules,
  assignRules,
} = require('../validators/leadValidators');

const router = express.Router();
router.use(authenticateJWT, enforceWorkspace);

router.get('/', ctrl.list);
router.get('/export/csv', ctrl.exportCsv);
router.post('/import/csv', checkPlanFeature('csv_import'), ctrl.importCsv);

router.post('/', createLeadRules, validateRequest, ctrl.create);
router.get('/:id', validateObjectId(), ctrl.getOne);
router.put('/:id', validateObjectId(), updateLeadRules, validateRequest, ctrl.update);
router.patch('/:id', validateObjectId(), ctrl.patch);
router.delete('/:id', validateObjectId(), requireRole('admin'), ctrl.remove);

router.post('/:id/notes', validateObjectId(), noteRules, validateRequest, ctrl.addNote);
router.post('/:id/calllog', validateObjectId(), callLogRules, validateRequest, ctrl.addCallLog);
router.put('/:id/assign', validateObjectId(), requireRole('admin'), assignRules, validateRequest, ctrl.assign);

module.exports = router;
