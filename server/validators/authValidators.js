const { body } = require('express-validator');

const strongPassword = body('password')
  .isString()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[a-z]/)
  .withMessage('Password needs a lowercase letter')
  .matches(/[A-Z]/)
  .withMessage('Password needs an uppercase letter')
  .matches(/[0-9]/)
  .withMessage('Password needs a number');

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password required'),
];

const registerRules = [
  body('name').isString().trim().notEmpty().withMessage('Full name required'),
  body('brandName').isString().trim().notEmpty().withMessage('Agency / brand name required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  strongPassword,
  body('phone').optional({ values: 'falsy' }).isString().trim(),
];

module.exports = { loginRules, registerRules, strongPassword };
