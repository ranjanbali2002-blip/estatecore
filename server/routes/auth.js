const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, refresh, logout, me } = require('../controllers/authController');
const { loginRules } = require('../validators/authValidators');
const { validateRequest } = require('../middleware/validate');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again in 15 minutes.' },
  },
});

router.post('/login', loginLimiter, loginRules, validateRequest, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateJWT, me);

module.exports = router;
