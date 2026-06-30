const Deal = require('../models/Deal');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/portal/:token  — public, no auth
const getByToken = asyncHandler(async (req, res) => {
  const deal = await Deal.findOne({
    clientPortalToken: req.params.token,
    clientPortalEnabled: true,
  })
    .populate('propertyId', 'title type location price bhk areaSqft imageUrls status')
    .populate('assignedAgentId', 'name email')
    .lean();

  if (!deal) throw AppError.notFound('Portal link is invalid or disabled');

  const workspace = await Workspace.findById(deal.workspaceId).lean();
  if (!workspace) throw AppError.notFound('Workspace not found');

  // Agent contact phone is not stored on User; provide email only + support
  res.json({
    success: true,
    data: {
      brand: {
        name: workspace.brand?.name || 'EstateCore',
        logoUrl: workspace.brand?.logoUrl || null,
        accentColor: workspace.brand?.accentColor || '#C9A84C',
        supportEmail: workspace.brand?.supportEmail || null,
      },
      deal: {
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        expectedCloseDate: deal.expectedCloseDate,
        updatedAt: deal.updatedAt,
      },
      property: deal.propertyId || null,
      agent: deal.assignedAgentId
        ? { name: deal.assignedAgentId.name, email: deal.assignedAgentId.email }
        : null,
    },
  });
});

module.exports = { getByToken };
