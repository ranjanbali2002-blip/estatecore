const Lead = require('../models/Lead');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const PAGE_SIZE = 25;

/** Agent sees leads assigned to them OR created by them; admin sees all. */
function scopeFilter(req, base = {}) {
  const filter = { workspaceId: req.workspace._id, ...base };
  if (req.isAgent) {
    filter.$or = [{ assignedAgentId: req.user._id }, { createdBy: req.user._id }];
  }
  return filter;
}

// GET /api/leads
const list = asyncHandler(async (req, res) => {
  const { search, status, source, agent, sortBy = 'createdAt', order = 'desc', page = 1 } = req.query;
  const extra = {};
  if (status) extra.status = { $in: String(status).split(',') };
  if (source) extra.source = { $in: String(source).split(',') };
  if (agent) extra.assignedAgentId = agent;

  const filter = scopeFilter(req, extra);

  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const searchOr = [{ name: rx }, { phone: rx }, { email: rx }];
    // Combine with agent $or if present
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  const sortField = ['budget', 'createdAt', 'name'].includes(sortBy) ? sortBy : 'createdAt';
  const sort = { [sortField]: order === 'asc' ? 1 : -1 };
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const [items, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedAgentId', 'name email')
      .sort(sort)
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { items, total, page: pageNum, pageSize: PAGE_SIZE, pages: Math.ceil(total / PAGE_SIZE) },
  });
});

async function findScoped(req) {
  const lead = await Lead.findOne(scopeFilter(req, { _id: req.params.id }))
    .populate('assignedAgentId', 'name email')
    .populate('notes.createdBy', 'name')
    .populate('callLog.loggedBy', 'name');
  if (!lead) throw AppError.notFound('Lead not found');
  return lead;
}

// GET /api/leads/:id
const getOne = asyncHandler(async (req, res) => {
  const lead = await findScoped(req);
  res.json({ success: true, data: lead });
});

// POST /api/leads
const create = asyncHandler(async (req, res) => {
  const body = req.body;
  const lead = await Lead.create({
    workspaceId: req.workspace._id,
    name: body.name,
    phone: body.phone,
    email: body.email,
    budget: body.budget || 0,
    propertyType: body.propertyType,
    locationInterest: body.locationInterest,
    source: body.source || 'Other',
    status: body.status || 'New',
    // Agents can only assign to themselves; admins may pass any agent
    assignedAgentId: req.isAgent ? req.user._id : body.assignedAgentId || null,
    createdBy: req.user._id,
  });
  const populated = await lead.populate('assignedAgentId', 'name email');
  res.status(201).json({ success: true, data: populated });
});

// PUT /api/leads/:id  (full editable fields)
const update = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!lead) throw AppError.notFound('Lead not found');

  const editable = ['name', 'phone', 'email', 'budget', 'propertyType', 'locationInterest', 'source', 'status'];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) lead[f] = req.body[f];
  });
  // Only admins may reassign
  if (!req.isAgent && req.body.assignedAgentId !== undefined) {
    lead.assignedAgentId = req.body.assignedAgentId || null;
  }
  await lead.save();
  const populated = await lead.populate('assignedAgentId', 'name email');
  res.json({ success: true, data: populated });
});

// PATCH /api/leads/:id (partial — used by kanban for status)
const patch = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!lead) throw AppError.notFound('Lead not found');
  if (req.body.status !== undefined) lead.status = req.body.status;
  await lead.save();
  res.json({ success: true, data: lead });
});

// DELETE /api/leads/:id (admin only — enforced at route)
const remove = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndDelete({ workspaceId: req.workspace._id, _id: req.params.id });
  if (!lead) throw AppError.notFound('Lead not found');
  res.json({ success: true, data: { id: lead._id } });
});

// POST /api/leads/:id/notes
const addNote = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!lead) throw AppError.notFound('Lead not found');
  lead.notes.push({ text: req.body.text, createdBy: req.user._id, createdAt: new Date() });
  await lead.save();
  await lead.populate('notes.createdBy', 'name');
  res.status(201).json({ success: true, data: lead.notes });
});

// POST /api/leads/:id/calllog
const addCallLog = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!lead) throw AppError.notFound('Lead not found');
  lead.callLog.push({
    outcome: req.body.outcome,
    duration: req.body.duration || 0,
    notes: req.body.notes,
    loggedBy: req.user._id,
    loggedAt: new Date(),
  });
  await lead.save();
  await lead.populate('callLog.loggedBy', 'name');
  res.status(201).json({ success: true, data: lead.callLog });
});

// PUT /api/leads/:id/assign (admin only)
const assign = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ workspaceId: req.workspace._id, _id: req.params.id });
  if (!lead) throw AppError.notFound('Lead not found');
  // verify agent belongs to workspace
  const agent = await User.findOne({
    _id: req.body.assignedAgentId,
    workspaceId: req.workspace._id,
  });
  if (!agent) throw AppError.badRequest('Agent not found in this workspace');
  lead.assignedAgentId = agent._id;
  await lead.save();
  res.json({ success: true, data: lead });
});

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/leads/export/csv
const exportCsv = asyncHandler(async (req, res) => {
  const { status, source, agent } = req.query;
  const extra = {};
  if (status) extra.status = { $in: String(status).split(',') };
  if (source) extra.source = { $in: String(source).split(',') };
  if (agent) extra.assignedAgentId = agent;

  const leads = await Lead.find(scopeFilter(req, extra))
    .populate('assignedAgentId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    'Name',
    'Phone',
    'Email',
    'Budget',
    'Property Type',
    'Location Interest',
    'Source',
    'Status',
    'Assigned Agent',
    'Date Added',
  ];
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      l.email,
      l.budget,
      l.propertyType,
      l.locationInterest,
      l.source,
      l.status,
      l.assignedAgentId?.name || '',
      new Date(l.createdAt).toLocaleDateString('en-IN'),
    ]
      .map(csvEscape)
      .join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');

  const brandName = (req.workspace.brand?.name || 'EstateCore').replace(/[^a-z0-9]/gi, '_');
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${brandName}-${date}.csv"`);
  res.send('﻿' + csv);
});

// POST /api/leads/import/csv  (Pro+) — accepts { rows: [...] }
const importCsv = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  if (rows.length === 0) throw AppError.badRequest('No rows to import');
  if (rows.length > 500) throw AppError.badRequest('Maximum 500 rows per import');

  const TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'];
  const SOURCES = ['Website', 'Referral', 'Instagram', 'Facebook', 'Walk-in', 'Other'];
  const STATUSES = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Won', 'Lost'];

  const valid = [];
  let skipped = 0;
  for (const r of rows) {
    const name = (r.name || r.Name || '').toString().trim();
    if (!name) {
      skipped += 1;
      continue;
    }
    valid.push({
      workspaceId: req.workspace._id,
      name,
      phone: (r.phone || r.Phone || '').toString().trim(),
      email: (r.email || r.Email || '').toString().trim().toLowerCase(),
      budget: Number(r.budget || r.Budget) || 0,
      propertyType: TYPES.includes(r.propertyType) ? r.propertyType : undefined,
      source: SOURCES.includes(r.source) ? r.source : 'Other',
      status: STATUSES.includes(r.status) ? r.status : 'New',
      locationInterest: (r.locationInterest || r.location || '').toString().trim(),
      assignedAgentId: req.isAgent ? req.user._id : null,
      createdBy: req.user._id,
    });
  }

  if (valid.length) await Lead.insertMany(valid, { ordered: false });

  res.status(201).json({
    success: true,
    data: { imported: valid.length, skipped, total: rows.length },
  });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  patch,
  remove,
  addNote,
  addCallLog,
  assign,
  exportCsv,
  importCsv,
};
