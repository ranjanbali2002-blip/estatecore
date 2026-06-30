const express = require('express');
const ctrl = require('../controllers/billingController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { requirePaymentsEnabled } = require('../middleware/razorpay');

const router = express.Router();

// NOTE: the webhook route is mounted separately in server.js with express.raw,
// BEFORE the json body parser. This router handles the authenticated endpoints.

router.use(authenticateJWT, enforceWorkspace);

router.get('/status', ctrl.status);
router.get('/history', ctrl.history);
router.post('/create-subscription', requireRole('admin'), requirePaymentsEnabled, ctrl.createSubscription);
router.post('/cancel', requireRole('admin'), requirePaymentsEnabled, ctrl.cancel);
router.post('/upgrade', requireRole('admin'), requirePaymentsEnabled, ctrl.upgrade);

module.exports = router;
