const crypto = require('crypto');
const Deal = require('../models/Deal');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const PAGE_SIZE = 50;

function scopeFilter(req, base = {}) {
  const filter = { workspaceId: req.workspace._id, ...base };
  if (req.isAgent) filter.assignedAgentId = req.user._id;
  return filter;
}

// GET /api/deals
const list = asyncHandler(async (req, res) => {
  const { stage, agent, page = 1 } = req.query;
  const extra = {};
  if (stage) extra.stage = stage;
  if (agent) extra.assignedAgentId = agent;
  const filter = scopeFilter(req, extra);
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const [items, total] = await Promise.all([
    Deal.find(filter)
      .populate('assignedAgentId', 'name email')
      .populate('leadId', 'name phone')
      .populate('propertyId', 'title location')
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Deal.countDocuments(filter),
  ]);

  res.json({ success: true, data: { items, total, page: pageNum, pageSize: PAGE_SIZE } });
});

const getOne = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne(scopeFilter(req, { _id: req.params.id }))
    .populate('assignedAgentId', 'name email')
    .populate('leadId', 'name phone')
    .populate('propertyId', 'title location price');
  if (!deal) throw AppError.notFound('Deal not found');
  res.json({ success: true, data: deal });
});

const create = asyncHandler(async (req, res) => {
  const b = req.body;
  const deal = await Deal.create({
    workspaceId: req.workspace._id,
    title: b.title,
    value: b.value || 0,
    stage: b.stage || 'Prospect',
    leadId: b.leadId || null,
    propertyId: b.propertyId || null,
    assignedAgentId: req.isAgent ? req.user._id : b.assignedAgentId || null,
    expectedCloseDate: b.expectedCloseDate || null,
    notes: b.notes,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: deal });
});

const update = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!deal) throw AppError.notFound('Deal not found');
  const editable = ['title', 'value', 'stage', 'leadId', 'propertyId', 'expectedCloseDate', 'notes'];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) deal[f] = req.body[f] || (f === 'value' ? 0 : deal[f]);
  });
  if (req.body.value !== undefined) deal.value = Number(req.body.value) || 0;
  if (!req.isAgent && req.body.assignedAgentId !== undefined) {
    deal.assignedAgentId = req.body.assignedAgentId || null;
  }
  await deal.save();
  res.json({ success: true, data: deal });
});

// PATCH /api/deals/:id/stage  (kanban drag)
const patchStage = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!deal) throw AppError.notFound('Deal not found');
  deal.stage = req.body.stage;
  await deal.save();
  res.json({ success: true, data: deal });
});

const remove = asyncHandler(async (req, res) => {
  const deal = await Deal.findOneAndDelete({ workspaceId: req.workspace._id, _id: req.params.id });
  if (!deal) throw AppError.notFound('Deal not found');
  res.json({ success: true, data: { id: deal._id } });
});

// POST /api/deals/:id/portal-token  (Enterprise)
const generatePortalToken = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!deal) throw AppError.notFound('Deal not found');
  deal.clientPortalToken = crypto.randomBytes(24).toString('hex');
  deal.clientPortalEnabled = true;
  await deal.save();
  res.json({
    success: true,
    data: {
      token: deal.clientPortalToken,
      url: `${process.env.FRONTEND_URL}/portal/${deal.clientPortalToken}`,
      enabled: deal.clientPortalEnabled,
    },
  });
});

// PATCH /api/deals/:id/portal-toggle
const togglePortal = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!deal) throw AppError.notFound('Deal not found');
  deal.clientPortalEnabled = !!req.body.enabled;
  if (deal.clientPortalEnabled && !deal.clientPortalToken) {
    deal.clientPortalToken = crypto.randomBytes(24).toString('hex');
  }
  await deal.save();
  res.json({
    success: true,
    data: {
      enabled: deal.clientPortalEnabled,
      token: deal.clientPortalToken,
      url: deal.clientPortalToken
        ? `${process.env.FRONTEND_URL}/portal/${deal.clientPortalToken}`
        : null,
    },
  });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  patchStage,
  remove,
  generatePortalToken,
  togglePortal,
};
