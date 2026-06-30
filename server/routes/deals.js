const express = require('express');
const ctrl = require('../controllers/dealsController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { checkPlanFeature } = require('../middleware/planGate');
const { validateRequest, validateObjectId } = require('../middleware/validate');
const { createDealRules, updateDealRules, stageRules } = require('../validators/dealValidators');

const router = express.Router();
router.use(authenticateJWT, enforceWorkspace);

router.get('/', ctrl.list);
router.post('/', createDealRules, validateRequest, ctrl.create);
router.get('/:id', validateObjectId(), ctrl.getOne);
router.put('/:id', validateObjectId(), updateDealRules, validateRequest, ctrl.update);
router.patch('/:id/stage', validateObjectId(), stageRules, validateRequest, ctrl.patchStage);
router.delete('/:id', validateObjectId(), requireRole('admin'), ctrl.remove);

// Client portal — Enterprise feature
router.post('/:id/portal-token', validateObjectId(), checkPlanFeature('client_portal'), ctrl.generatePortalToken);
router.patch('/:id/portal-toggle', validateObjectId(), checkPlanFeature('client_portal'), ctrl.togglePortal);

module.exports = router;
