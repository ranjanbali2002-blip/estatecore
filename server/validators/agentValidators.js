const { body } = require('express-validator');
const { strongPassword } = require('./authValidators');

const createAgentRules = [
  body('name').isString().trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  strongPassword,
];

const updateAgentRules = [
  body('name').optional().isString().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
];

const createTrialWorkspaceRules = [
  body('adminName').isString().trim().notEmpty().withMessage('Admin name required'),
  body('adminEmail').isEmail().withMessage('Valid admin email required').normalizeEmail(),
  body('adminPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[a-z]/)
    .matches(/[A-Z]/)
    .matches(/[0-9]/)
    .withMessage('Password needs upper, lower and a number'),
  body('brandName').isString().trim().notEmpty().withMessage('Brand name required'),
  body('trialPlan').isIn(['starter', 'pro', 'enterprise']).withMessage('Invalid plan'),
  body('trialDays').isInt({ min: 1, max: 365 }).withMessage('Trial days 1-365'),
  body('phone').optional().isString().trim(),
];

module.exports = { createAgentRules, updateAgentRules, createTrialWorkspaceRules };
