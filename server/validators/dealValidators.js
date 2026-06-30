const { body } = require('express-validator');

const STAGES = ['Prospect', 'Proposal', 'Negotiation', 'Legal', 'Closed Won', 'Closed Lost'];

const createDealRules = [
  body('title').isString().trim().notEmpty().withMessage('Title required'),
  body('value').optional().isNumeric().withMessage('Value must be a number'),
  body('stage').optional().isIn(STAGES),
  body('leadId').optional({ values: 'falsy' }).isMongoId(),
  body('propertyId').optional({ values: 'falsy' }).isMongoId(),
  body('assignedAgentId').optional({ values: 'falsy' }).isMongoId(),
  body('expectedCloseDate').optional({ values: 'falsy' }).isISO8601(),
  body('notes').optional().isString().trim(),
];

const updateDealRules = [
  body('title').optional().isString().trim().notEmpty(),
  body('value').optional().isNumeric(),
  body('stage').optional().isIn(STAGES),
  body('leadId').optional({ values: 'falsy' }).isMongoId(),
  body('propertyId').optional({ values: 'falsy' }).isMongoId(),
  body('assignedAgentId').optional({ values: 'falsy' }).isMongoId(),
  body('expectedCloseDate').optional({ values: 'falsy' }).isISO8601(),
  body('notes').optional().isString().trim(),
];

const stageRules = [body('stage').isIn(STAGES).withMessage('Invalid stage')];

module.exports = { createDealRules, updateDealRules, stageRules, STAGES };
