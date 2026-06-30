const { body } = require('express-validator');

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'];
const SOURCES = ['Website', 'Referral', 'Instagram', 'Facebook', 'Walk-in', 'Other'];
const STATUSES = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Won', 'Lost'];

const createLeadRules = [
  body('name').isString().trim().notEmpty().withMessage('Name required'),
  body('phone').optional().isString().trim(),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number'),
  body('propertyType').optional({ values: 'falsy' }).isIn(PROPERTY_TYPES),
  body('locationInterest').optional().isString().trim(),
  body('source').optional().isIn(SOURCES),
  body('status').optional().isIn(STATUSES),
  body('assignedAgentId').optional({ values: 'falsy' }).isMongoId(),
];

const updateLeadRules = [
  body('name').optional().isString().trim().notEmpty(),
  body('email').optional({ values: 'falsy' }).isEmail(),
  body('budget').optional().isNumeric(),
  body('propertyType').optional({ values: 'falsy' }).isIn(PROPERTY_TYPES),
  body('source').optional().isIn(SOURCES),
  body('status').optional().isIn(STATUSES),
  body('assignedAgentId').optional({ values: 'falsy' }).isMongoId(),
];

const noteRules = [body('text').isString().trim().notEmpty().withMessage('Note text required')];

const callLogRules = [
  body('outcome')
    .isIn(['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Voicemail'])
    .withMessage('Invalid outcome'),
  body('duration').optional().isNumeric(),
  body('notes').optional().isString().trim(),
];

const assignRules = [body('assignedAgentId').isMongoId().withMessage('Valid agent id required')];

module.exports = {
  createLeadRules,
  updateLeadRules,
  noteRules,
  callLogRules,
  assignRules,
  STATUSES,
};
