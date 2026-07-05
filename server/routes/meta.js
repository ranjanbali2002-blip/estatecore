const express = require('express');
const ctrl = require('../controllers/metaController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { requireMetaEnabled } = require('../middleware/meta');

const router = express.Router();

// All routes here are admin-only, workspace-scoped
router.use(authenticateJWT, enforceWorkspace, requireRole('admin'));

// Status is always readable (shows enabled:false when the platform hasn't enabled Meta)
router.get('/', ctrl.status);

// Connect flow requires META_ENABLED=true
router.get('/connect-url', requireMetaEnabled, ctrl.connectUrl);
router.post('/exchange', requireMetaEnabled, ctrl.exchangeCode);
router.post('/select-page', requireMetaEnabled, ctrl.selectPage);
router.post('/manual', requireMetaEnabled, ctrl.manualConnect);
router.put('/default-agent', ctrl.setDefaultAgent);
router.post('/disconnect', ctrl.disconnect);

module.exports = router;
