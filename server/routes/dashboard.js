const express = require('express');
const ctrl = require('../controllers/dashboardController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const { checkPlanFeature } = require('../middleware/planGate');

const router = express.Router();
router.use(authenticateJWT, enforceWorkspace);

router.get('/stats', ctrl.stats);
router.get('/activity', ctrl.activity);
router.get('/upcoming', ctrl.upcoming);
router.get('/analytics', ctrl.analytics);

// Enterprise + admin only
router.get('/leaderboard', requireRole('admin'), checkPlanFeature('leaderboard'), ctrl.leaderboard);
router.get('/forecast', requireRole('admin'), checkPlanFeature('revenue_forecast'), ctrl.forecast);

module.exports = router;
