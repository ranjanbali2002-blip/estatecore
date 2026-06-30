const express = require('express');
const ctrl = require('../controllers/tasksController');
const { authenticateJWT } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { validateRequest, validateObjectId } = require('../middleware/validate');
const { createTaskRules, updateTaskRules } = require('../validators/taskValidators');

const router = express.Router();
router.use(authenticateJWT, enforceWorkspace);

router.get('/', ctrl.list);
router.post('/', createTaskRules, validateRequest, ctrl.create);
router.get('/:id', validateObjectId(), ctrl.getOne);
router.put('/:id', validateObjectId(), updateTaskRules, validateRequest, ctrl.update);
router.patch('/:id/complete', validateObjectId(), ctrl.toggleComplete);
router.delete('/:id', validateObjectId(), ctrl.remove);

module.exports = router;
