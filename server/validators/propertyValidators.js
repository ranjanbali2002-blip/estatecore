const { body } = require('express-validator');

const TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'];
const STATUSES = ['Available', 'Under Negotiation', 'Sold'];

const createPropertyRules = [
  body('title').isString().trim().notEmpty().withMessage('Title required'),
  body('type').isIn(TYPES).withMessage('Invalid type'),
  body('location').optional().isString().trim(),
  body('price').optional().isNumeric(),
  body('bhk').optional().isNumeric(),
  body('areaSqft').optional().isNumeric(),
  body('status').optional().isIn(STATUSES),
  body('description').optional().isString().trim(),
  body('imageUrls').optional().isArray(),
  body('imageUrls.*').optional().isURL().withMessage('Invalid image URL'),
];

const updatePropertyRules = [
  body('title').optional().isString().trim().notEmpty(),
  body('type').optional().isIn(TYPES),
  body('price').optional().isNumeric(),
  body('bhk').optional().isNumeric(),
  body('areaSqft').optional().isNumeric(),
  body('status').optional().isIn(STATUSES),
  body('imageUrls').optional().isArray(),
  body('imageUrls.*').optional().isURL(),
];

module.exports = { createPropertyRules, updatePropertyRules, TYPES, STATUSES };
