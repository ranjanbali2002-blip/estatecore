const Property = require('../models/Property');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const PAGE_SIZE = 24;

// Properties are visible to all members of a workspace (agents included)
function wsFilter(req, base = {}) {
  return { workspaceId: req.workspace._id, ...base };
}

const list = asyncHandler(async (req, res) => {
  const { type, status, search, page = 1 } = req.query;
  const filter = wsFilter(req);
  if (type) filter.type = { $in: String(type).split(',') };
  if (status) filter.status = { $in: String(status).split(',') };
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { location: rx }];
  }
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const [items, total] = await Promise.all([
    Property.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Property.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, total, page: pageNum, pageSize: PAGE_SIZE } });
});

const getOne = asyncHandler(async (req, res) => {
  const property = await Property.findOne(wsFilter(req, { _id: req.params.id }));
  if (!property) throw AppError.notFound('Property not found');
  res.json({ success: true, data: property });
});

const create = asyncHandler(async (req, res) => {
  const b = req.body;
  const property = await Property.create({
    workspaceId: req.workspace._id,
    title: b.title,
    type: b.type,
    location: b.location,
    price: b.price || 0,
    bhk: b.bhk || 0,
    areaSqft: b.areaSqft || 0,
    status: b.status || 'Available',
    description: b.description,
    imageUrls: Array.isArray(b.imageUrls) ? b.imageUrls.filter(Boolean) : [],
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: property });
});

const update = asyncHandler(async (req, res) => {
  const property = await Property.findOne(wsFilter(req, { _id: req.params.id }));
  if (!property) throw AppError.notFound('Property not found');
  const editable = ['title', 'type', 'location', 'price', 'bhk', 'areaSqft', 'status', 'description'];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) property[f] = req.body[f];
  });
  if (Array.isArray(req.body.imageUrls)) {
    property.imageUrls = req.body.imageUrls.filter(Boolean);
  }
  await property.save();
  res.json({ success: true, data: property });
});

// admin only (enforced at route)
const remove = asyncHandler(async (req, res) => {
  const property = await Property.findOneAndDelete(wsFilter(req, { _id: req.params.id }));
  if (!property) throw AppError.notFound('Property not found');
  res.json({ success: true, data: { id: property._id } });
});

module.exports = { list, getOne, create, update, remove };
