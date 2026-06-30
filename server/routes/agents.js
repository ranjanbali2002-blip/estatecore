const express = require('express');
const ctrl = require('../controllers/agentsController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { checkAgentLimit } = require('../middleware/agentLimit');
const { validateRequest, validateObjectId } = require('../middleware/validate');
const { createAgentRules, updateAgentRules } = require('../validators/agentValidators');

const router = express.Router();

// Agent management is admin-only
router.use(authenticateJWT, enforceWorkspace, requireRole('admin'));

router.get('/', ctrl.list);
router.post('/', checkAgentLimit, createAgentRules, validateRequest, ctrl.create);
router.put('/:id', validateObjectId(), updateAgentRules, validateRequest, ctrl.update);
router.put('/:id/status', validateObjectId(), ctrl.setStatus);
router.delete('/:id', validateObjectId(), ctrl.remove);
router.get('/:id/stats', validateObjectId(), ctrl.getStats);

module.exports = router;
