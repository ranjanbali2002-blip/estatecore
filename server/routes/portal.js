const express = require('express');
const ctrl = require('../controllers/portalController');

const router = express.Router();

// Public — no auth. Token in URL.
router.get('/:token', ctrl.getByToken);

module.exports = router;
