const Workspace = require('../models/Workspace');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { uploadLogo, deleteAsset } = require('../utils/cloudinary');
const { planHasFeature } = require('../utils/plans');

// GET /api/workspace/brand
const getBrand = asyncHandler(async (req, res) => {
  const ws = req.workspace;
  res.json({
    success: true,
    data: {
      brand: ws.brand,
      plan: ws.plan,
      effectivePlan: ws.getEffectivePlan(),
      status: ws.getEffectiveStatus(),
      trial: ws.trial,
      agentLimit: ws.agentLimit,
    },
  });
});

// PUT /api/workspace/brand  (admin only)
const updateBrand = asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.workspace._id);
  if (!ws) throw AppError.notFound('Workspace not found');

  const { name, accentColor, supportEmail, subdomain } = req.body;
  if (name !== undefined) ws.brand.name = name;
  if (accentColor !== undefined) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(accentColor)) {
      throw AppError.badRequest('Invalid accent color', 'VALIDATION_ERROR', [
        { field: 'accentColor', message: 'Must be a hex color e.g. #C9A84C' },
      ]);
    }
    ws.brand.accentColor = accentColor;
  }
  if (supportEmail !== undefined) ws.brand.supportEmail = supportEmail;

  // Subdomain gated to Pro+
  if (subdomain !== undefined) {
    if (!planHasFeature(ws.getEffectivePlan(), 'subdomain')) {
      throw new AppError('Subdomain requires the Pro plan', 403, 'PLAN_REQUIRED', {
        feature: 'subdomain',
        requiredPlan: 'pro',
      });
    }
    ws.brand.subdomain = subdomain;
  }

  await ws.save();
  res.json({ success: true, data: { brand: ws.brand } });
});

// POST /api/workspace/brand/logo  (multipart, field "logo")
const uploadBrandLogo = asyncHandler(async (req, res) => {
  if (!req.file) throw AppError.badRequest('No file uploaded');
  const ws = await Workspace.findById(req.workspace._id);
  if (!ws) throw AppError.notFound('Workspace not found');

  // delete old logo first
  if (ws.brand.logoPublicId) {
    await deleteAsset(ws.brand.logoPublicId);
  }

  const { url, publicId } = await uploadLogo(req.file.buffer, ws._id.toString());
  ws.brand.logoUrl = url;
  ws.brand.logoPublicId = publicId;
  await ws.save();

  res.json({ success: true, data: { logoUrl: url, logoPublicId: publicId } });
});

module.exports = { getBrand, updateBrand, uploadBrandLogo };
