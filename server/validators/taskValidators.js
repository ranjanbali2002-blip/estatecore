const { body } = require('express-validator');

const createTaskRules = [
  body('title').isString().trim().notEmpty().withMessage('Title required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('priority').optional().isIn(['High', 'Medium', 'Low']),
  body('leadId').optional({ values: 'falsy' }).isMongoId(),
  body('assignedAgentId').optional({ values: 'falsy' }).isMongoId(),
  body('notes').optional().isString().trim(),
];

const updateTaskRules = [
  body('title').optional().isString().trim().notEmpty(),
  body('dueDate').optional().isISO8601(),
  body('priority').optional().isIn(['High', 'Medium', 'Low']),
  body('status').optional().isIn(['Pending', 'Completed']),
  body('leadId').optional({ values: 'falsy' }).isMongoId(),
  body('assignedAgentId').optional({ values: 'falsy' }).isMongoId(),
  body('notes').optional().isString().trim(),
];

module.exports = { createTaskRules, updateTaskRules };
