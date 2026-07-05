const express = require('express');
const ctrl = require('../controllers/architectController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateRequest, validateObjectId } = require('../middleware/validate');
const { createTrialWorkspaceRules } = require('../validators/agentValidators');

const router = express.Router();

// All architect routes require the architect role
router.use(authenticateJWT, requireRole('architect'));

router.get('/dashboard', ctrl.dashboard);
router.get('/workspaces', ctrl.listWorkspaces);
router.get('/workspaces/:id', validateObjectId(), ctrl.getWorkspace);
router.post('/workspaces/trial', createTrialWorkspaceRules, validateRequest, ctrl.createTrial);
router.put('/workspaces/:id/status', validateObjectId(), ctrl.setStatus);
router.put('/workspaces/:id/plan', validateObjectId(), ctrl.setPlan);
router.put('/workspaces/:id/extend-trial', validateObjectId(), ctrl.extendTrial);
router.put('/workspaces/:id/convert-paid', validateObjectId(), ctrl.convertPaid);
router.get('/trial-requests', ctrl.listTrialRequests);
router.put('/workspaces/:id/approve', validateObjectId(), ctrl.approveRequest);
router.put('/workspaces/:id/reject', validateObjectId(), ctrl.rejectRequest);
router.get('/billing', ctrl.billing);

module.exports = router;
