const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Property = require('../models/Property');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../utils/email');
const { trialWelcome, trialExtended, trialApprovedSelf, trialRejected } = require('../utils/emailTemplates');
const { getAgentLimit, PLANS } = require('../utils/plans');

const DAY = 24 * 60 * 60 * 1000;

// GET /api/architect/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY);

  const [totalActive, trialWorkspaces, expiringThisWeek, planAgg, recentTrials, expiringSoon, pendingRequests] =
    await Promise.all([
      Workspace.countDocuments({ status: 'active' }),
      Workspace.countDocuments({ 'trial.enabled': true, 'trial.expiresAt': { $gt: now } }),
      Workspace.countDocuments({
        'trial.enabled': true,
        'trial.expiresAt': { $gt: now, $lte: weekAhead },
      }),
      Workspace.aggregate([{ $group: { _id: '$plan', count: { $sum: 1 } } }]),
      Workspace.find({ 'trial.enabled': true })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('adminId', 'name email')
        .lean(),
      Workspace.find({
        'trial.enabled': true,
        'trial.expiresAt': { $gt: now, $lte: weekAhead },
      })
        .sort({ 'trial.expiresAt': 1 })
        .populate('adminId', 'name email')
        .lean(),
      Workspace.countDocuments({ status: 'pending' }),
    ]);

  // MRR — 0 in Phase 1 (no live payments). Real once PAYMENTS_ENABLED.
  let mrr = 0;
  if (process.env.PAYMENTS_ENABLED === 'true') {
    const paid = await Workspace.find({
      'trial.enabled': false,
      status: 'active',
    }).lean();
    mrr = paid.reduce((sum, w) => sum + (PLANS[w.plan]?.priceMonthly || 0), 0);
  }

  // MRR by month — last 12 months (Phase 1 all zeros, structure ready)
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), mrr: i === 0 ? mrr : 0 });
  }

  const planDistribution = ['starter', 'pro', 'enterprise'].map((p) => ({
    plan: p,
    count: planAgg.find((x) => x._id === p)?.count || 0,
  }));

  res.json({
    success: true,
    data: {
      kpis: {
        totalActiveWorkspaces: totalActive,
        trialWorkspaces,
        expiringThisWeek,
        mrr,
        pendingRequests,
      },
      mrrByMonth: months,
      planDistribution,
      recentTrials: recentTrials.map(mapWorkspaceRow),
      expiringSoon: expiringSoon.map(mapWorkspaceRow),
    },
  });
});

function mapWorkspaceRow(w) {
  const now = Date.now();
  const isTrial = w.trial?.enabled;
  const expiresAt = isTrial ? w.trial.expiresAt : w.razorpay?.currentPeriodEnd;
  let effectiveStatus = w.status;
  if (isTrial && w.trial.expiresAt && now > new Date(w.trial.expiresAt).getTime()) {
    effectiveStatus = 'trial_expired';
  }
  return {
    id: w._id,
    brandName: w.brand?.name,
    adminName: w.adminId?.name,
    adminEmail: w.adminId?.email,
    plan: isTrial ? w.trial.plan : w.plan,
    mode: isTrial ? 'trial' : 'paid',
    status: effectiveStatus,
    expiresAt,
    daysLeft: expiresAt ? Math.ceil((new Date(expiresAt).getTime() - now) / DAY) : null,
    agentLimit: w.agentLimit,
  };
}

// GET /api/architect/workspaces
const listWorkspaces = asyncHandler(async (req, res) => {
  const { search, plan, status, mode, page = 1 } = req.query;
  const PAGE = 20;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const filter = {};
  if (plan) filter.$or = [{ plan }, { 'trial.plan': plan, 'trial.enabled': true }];
  if (mode === 'trial') filter['trial.enabled'] = true;
  if (mode === 'paid') filter['trial.enabled'] = false;
  if (status && status !== 'trial_expired') filter.status = status;

  let adminIds;
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const admins = await User.find({ role: 'admin', $or: [{ name: rx }, { email: rx }] }).select('_id');
    adminIds = admins.map((a) => a._id);
    filter.$and = [
      { $or: [{ 'brand.name': rx }, { adminId: { $in: adminIds } }] },
    ];
  }

  let workspaces = await Workspace.find(filter)
    .sort({ createdAt: -1 })
    .populate('adminId', 'name email')
    .lean();

  // agent + lead counts
  const rows = await Promise.all(
    workspaces.map(async (w) => {
      const [agentsUsed, leadsCount] = await Promise.all([
        User.countDocuments({ workspaceId: w._id, role: 'agent' }),
        Lead.countDocuments({ workspaceId: w._id }),
      ]);
      return { ...mapWorkspaceRow(w), agentsUsed, leadsCount };
    })
  );

  // computed trial_expired filter (applied post-map)
  const filtered = status === 'trial_expired' ? rows.filter((r) => r.status === 'trial_expired') : rows;

  const total = filtered.length;
  const paged = filtered.slice((pageNum - 1) * PAGE, pageNum * PAGE);

  res.json({
    success: true,
    data: { items: paged, total, page: pageNum, pageSize: PAGE, pages: Math.ceil(total / PAGE) },
  });
});

// GET /api/architect/workspaces/:id
const getWorkspace = asyncHandler(async (req, res) => {
  const w = await Workspace.findById(req.params.id).populate('adminId', 'name email lastLoginAt').lean();
  if (!w) throw AppError.notFound('Workspace not found');

  const [agents, leadsCount, dealsCount, propertiesCount, tasksCount] = await Promise.all([
    User.find({ workspaceId: w._id, role: 'agent' }).select('name email isActive lastLoginAt').lean(),
    Lead.countDocuments({ workspaceId: w._id }),
    Deal.countDocuments({ workspaceId: w._id }),
    Property.countDocuments({ workspaceId: w._id }),
    Task.countDocuments({ workspaceId: w._id }),
  ]);

  // recent activity (last 10 across leads/deals/tasks by updatedAt)
  const [recentLeads, recentDeals, recentTasks] = await Promise.all([
    Lead.find({ workspaceId: w._id }).sort({ updatedAt: -1 }).limit(5).select('name updatedAt').lean(),
    Deal.find({ workspaceId: w._id }).sort({ updatedAt: -1 }).limit(5).select('title stage updatedAt').lean(),
    Task.find({ workspaceId: w._id }).sort({ updatedAt: -1 }).limit(5).select('title status updatedAt').lean(),
  ]);
  const activity = [
    ...recentLeads.map((l) => ({ type: 'lead', text: `Lead: ${l.name}`, at: l.updatedAt })),
    ...recentDeals.map((d) => ({ type: 'deal', text: `Deal: ${d.title} (${d.stage})`, at: d.updatedAt })),
    ...recentTasks.map((t) => ({ type: 'task', text: `Task: ${t.title} (${t.status})`, at: t.updatedAt })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      workspace: { ...mapWorkspaceRow(w), brand: w.brand, trial: w.trial, razorpay: w.razorpay, plan: w.plan },
      admin: w.adminId,
      counts: { agents: agents.length, leads: leadsCount, deals: dealsCount, properties: propertiesCount, tasks: tasksCount },
      agents,
      activity,
    },
  });
});

// POST /api/architect/workspaces/trial
const createTrial = asyncHandler(async (req, res) => {
  const { adminName, adminEmail, adminPassword, brandName, trialPlan, trialDays, phone } = req.body;

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    throw AppError.badRequest('A user with this email already exists', 'VALIDATION_ERROR', [
      { field: 'adminEmail', message: 'Email already in use' },
    ]);
  }

  // Two-step create with cleanup on failure. Avoids requiring a replica set
  // (transactions), so this works on any MongoDB deployment / free tier.
  const admin = await User.create({
    role: 'admin',
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    isActive: true,
  });

  let workspace;
  try {
    workspace = await Workspace.create({
      adminId: admin._id,
      plan: trialPlan,
      agentLimit: getAgentLimit(trialPlan),
      status: 'active',
      trial: {
        enabled: true,
        plan: trialPlan,
        expiresAt: new Date(Date.now() + Number(trialDays) * DAY),
        createdByArchitect: true,
      },
      brand: { name: brandName, accentColor: '#C9A84C' },
    });
    admin.workspaceId = workspace._id;
    await admin.save();
  } catch (err) {
    // roll back the orphaned admin so a retry with the same email succeeds
    await User.deleteOne({ _id: admin._id });
    throw err;
  }

  // Welcome email (best-effort)
  await sendEmail({
    to: adminEmail,
    ...trialWelcome({
      brand: workspace.brand,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      email: adminEmail,
      password: adminPassword,
      expiresAt: workspace.trial.expiresAt,
      whatsapp: process.env.ARCHITECT_WHATSAPP,
    }),
  });

  res.status(201).json({
    success: true,
    data: {
      workspaceId: workspace._id,
      brandName: workspace.brand.name,
      adminEmail,
      adminPassword, // returned once so architect can copy
      trialPlan,
      expiresAt: workspace.trial.expiresAt,
      phone: phone || null,
    },
  });
});

// PUT /api/architect/workspaces/:id/status
const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) throw AppError.badRequest('Invalid status');
  const w = await Workspace.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!w) throw AppError.notFound('Workspace not found');
  res.json({ success: true, data: { id: w._id, status: w.status } });
});

// PUT /api/architect/workspaces/:id/plan
const setPlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!['starter', 'pro', 'enterprise'].includes(plan)) throw AppError.badRequest('Invalid plan');
  const w = await Workspace.findById(req.params.id);
  if (!w) throw AppError.notFound('Workspace not found');
  w.plan = plan;
  w.agentLimit = getAgentLimit(plan);
  if (w.trial.enabled) w.trial.plan = plan;
  await w.save();
  res.json({ success: true, data: { id: w._id, plan: w.plan, agentLimit: w.agentLimit } });
});

// PUT /api/architect/workspaces/:id/extend-trial
const extendTrial = asyncHandler(async (req, res) => {
  const days = Number(req.body.days);
  if (![7, 14, 30].includes(days)) throw AppError.badRequest('Days must be 7, 14 or 30');
  const w = await Workspace.findById(req.params.id).populate('adminId', 'name email');
  if (!w) throw AppError.notFound('Workspace not found');
  if (!w.trial.enabled) throw AppError.badRequest('Workspace is not on a trial');

  const base = w.trial.expiresAt && w.trial.expiresAt > new Date() ? w.trial.expiresAt : new Date();
  w.trial.expiresAt = new Date(base.getTime() + days * DAY);
  // reset reminder/expiry flags so the new window can notify again
  w.trial.reminderSent3Day = false;
  w.trial.reminderSent1Day = false;
  w.trial.expiredEmailSent = false;
  if (w.status === 'trial_expired') w.status = 'active';
  await w.save();

  await sendEmail({
    to: w.adminId.email,
    ...trialExtended({
      brand: w.brand,
      expiresAt: w.trial.expiresAt,
      days,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
    }),
  });

  res.json({ success: true, data: { id: w._id, expiresAt: w.trial.expiresAt } });
});

// PUT /api/architect/workspaces/:id/convert-paid
const convertPaid = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!['starter', 'pro', 'enterprise'].includes(plan)) throw AppError.badRequest('Invalid plan');
  const w = await Workspace.findById(req.params.id);
  if (!w) throw AppError.notFound('Workspace not found');

  w.trial.enabled = false;
  w.plan = plan;
  w.agentLimit = getAgentLimit(plan);
  w.status = 'active';
  // Phase 3: Razorpay subscription creation would happen here.
  await w.save();

  res.json({ success: true, data: { id: w._id, plan: w.plan, status: w.status } });
});

// GET /api/architect/trial-requests — pending self-registrations
const listTrialRequests = asyncHandler(async (req, res) => {
  const pending = await Workspace.find({ status: 'pending' })
    .sort({ 'signup.requestedAt': -1, createdAt: -1 })
    .populate('adminId', 'name email')
    .lean();
  res.json({
    success: true,
    data: {
      items: pending.map((w) => ({
        id: w._id,
        brandName: w.brand?.name,
        adminName: w.adminId?.name,
        adminEmail: w.adminId?.email,
        phone: w.signup?.phone || null,
        requestedAt: w.signup?.requestedAt || w.createdAt,
      })),
      total: pending.length,
    },
  });
});

// PUT /api/architect/workspaces/:id/approve — { trialDays=30, plan='pro' }
const approveRequest = asyncHandler(async (req, res) => {
  const trialDays = [7, 14, 30, 60, 90].includes(Number(req.body.trialDays)) ? Number(req.body.trialDays) : 30;
  const plan = ['starter', 'pro', 'enterprise'].includes(req.body.plan) ? req.body.plan : 'pro';

  const ws = await Workspace.findById(req.params.id).populate('adminId', 'name email');
  if (!ws) throw AppError.notFound('Workspace not found');
  if (ws.status !== 'pending') throw AppError.badRequest('This workspace is not pending approval');

  ws.plan = plan;
  ws.agentLimit = getAgentLimit(plan);
  ws.status = 'active';
  ws.trial = {
    enabled: true,
    plan,
    expiresAt: new Date(Date.now() + trialDays * DAY),
    createdByArchitect: false,
  };
  ws.signup.approvedAt = new Date();
  ws.signup.approvedBy = req.user._id;
  await ws.save();

  await User.updateOne({ _id: ws.adminId._id }, { $set: { isActive: true } });

  await sendEmail({
    to: ws.adminId.email,
    ...trialApprovedSelf({
      brand: ws.brand,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      expiresAt: ws.trial.expiresAt,
      whatsapp: process.env.ARCHITECT_WHATSAPP,
    }),
  });

  res.json({ success: true, data: { id: ws._id, status: ws.status, expiresAt: ws.trial.expiresAt } });
});

// PUT /api/architect/workspaces/:id/reject
const rejectRequest = asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.params.id).populate('adminId', 'name email');
  if (!ws) throw AppError.notFound('Workspace not found');
  if (ws.status !== 'pending') throw AppError.badRequest('This workspace is not pending approval');

  ws.status = 'inactive';
  ws.signup.rejectedAt = new Date();
  await ws.save();

  await sendEmail({
    to: ws.adminId.email,
    ...trialRejected({ brand: ws.brand, whatsapp: process.env.ARCHITECT_WHATSAPP }),
  });

  res.json({ success: true, data: { id: ws._id, status: ws.status } });
});

// GET /api/architect/billing
const billing = asyncHandler(async (req, res) => {
  const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
  if (!paymentsEnabled) {
    return res.json({
      success: true,
      data: { paymentsEnabled, message: 'Payments not yet enabled', events: [], totalRevenue: 0 },
    });
  }
  const BillingEvent = require('../models/BillingEvent');
  const events = await BillingEvent.find().sort({ processedAt: -1 }).limit(200).lean();
  res.json({ success: true, data: { paymentsEnabled, events, totalRevenue: 0 } });
});

module.exports = {
  dashboard,
  listWorkspaces,
  getWorkspace,
  createTrial,
  setStatus,
  setPlan,
  extendTrial,
  convertPaid,
  listTrialRequests,
  approveRequest,
  rejectRequest,
  billing,
};
