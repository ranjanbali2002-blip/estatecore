const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const DAY = 24 * 60 * 60 * 1000;
const CLOSED_WON = 'Closed Won';
const CLOSED_LOST = 'Closed Lost';

/** Base match honoring agent scoping for the given ownership field. */
function match(req, ownerField = 'assignedAgentId', extra = {}) {
  const m = { workspaceId: req.workspace._id, ...extra };
  if (req.isAgent) m[ownerField] = req.user._id;
  return m;
}

// GET /api/dashboard/stats
const stats = asyncHandler(async (req, res) => {
  const leadMatch = (() => {
    const m = { workspaceId: req.workspace._id };
    if (req.isAgent) {
      // leads: assigned OR created by agent
      return { workspaceId: req.workspace._id, $or: [{ assignedAgentId: req.user._id }, { createdBy: req.user._id }] };
    }
    return m;
  })();

  const dealMatch = match(req);

  const [totalLeads, activeDeals, pipelineAgg, closedWon, closedTotal, leadSourceAgg, dealStageAgg] =
    await Promise.all([
      Lead.countDocuments(leadMatch),
      Deal.countDocuments({ ...dealMatch, stage: { $nin: [CLOSED_WON, CLOSED_LOST] } }),
      Deal.aggregate([
        { $match: { ...dealMatch, stage: { $nin: [CLOSED_WON, CLOSED_LOST] } } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
      Deal.countDocuments({ ...dealMatch, stage: CLOSED_WON }),
      Deal.countDocuments({ ...dealMatch, stage: { $in: [CLOSED_WON, CLOSED_LOST] } }),
      Lead.aggregate([{ $match: leadMatch }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
      Deal.aggregate([{ $match: dealMatch }, { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } }]),
    ]);

  const pipelineValue = pipelineAgg[0]?.total || 0;
  const winRate = closedTotal > 0 ? Math.round((closedWon / closedTotal) * 100) : 0;

  res.json({
    success: true,
    data: {
      kpis: { totalLeads, activeDeals, pipelineValue, winRate },
      leadSource: leadSourceAgg.map((s) => ({ source: s._id || 'Other', count: s.count })),
      dealStage: dealStageAgg.map((s) => ({ stage: s._id, count: s.count, value: s.value })),
    },
  });
});

// GET /api/dashboard/activity
const activity = asyncHandler(async (req, res) => {
  const leadMatch = req.isAgent
    ? { workspaceId: req.workspace._id, $or: [{ assignedAgentId: req.user._id }, { createdBy: req.user._id }] }
    : { workspaceId: req.workspace._id };

  const [leads, deals, tasks] = await Promise.all([
    Lead.find(leadMatch).sort({ createdAt: -1 }).limit(8).populate('assignedAgentId', 'name').lean(),
    Deal.find(match(req)).sort({ updatedAt: -1 }).limit(8).populate('assignedAgentId', 'name').lean(),
    Task.find({ ...match(req), status: 'Completed' }).sort({ completedAt: -1 }).limit(8).populate('assignedAgentId', 'name').lean(),
  ]);

  const items = [
    ...leads.map((l) => ({ type: 'lead', text: `New lead added: ${l.name}`, agent: l.assignedAgentId?.name, at: l.createdAt })),
    ...deals.map((d) => ({ type: 'deal', text: `Deal "${d.title}" in ${d.stage}`, agent: d.assignedAgentId?.name, at: d.updatedAt })),
    ...tasks.map((t) => ({ type: 'task', text: `Task completed: ${t.title}`, agent: t.assignedAgentId?.name, at: t.completedAt })),
  ]
    .filter((x) => x.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 10);

  res.json({ success: true, data: { items } });
});

// GET /api/dashboard/upcoming — tasks due in next 7 days
const upcoming = asyncHandler(async (req, res) => {
  const now = new Date();
  const end = new Date(now.getTime() + 7 * DAY);
  const tasks = await Task.find({
    ...match(req),
    status: 'Pending',
    dueDate: { $lte: end },
  })
    .sort({ dueDate: 1 })
    .limit(20)
    .populate('leadId', 'name')
    .populate('assignedAgentId', 'name')
    .lean();
  res.json({ success: true, data: { items: tasks } });
});

// GET /api/dashboard/analytics
const analytics = asyncHandler(async (req, res) => {
  const dealMatch = match(req);
  const leadMatch = req.isAgent
    ? { workspaceId: req.workspace._id, $or: [{ assignedAgentId: req.user._id }, { createdBy: req.user._id }] }
    : { workspaceId: req.workspace._id };

  // Conversion funnel from lead statuses
  const STATUS_ORDER = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Won'];
  const leadStatusAgg = await Lead.aggregate([
    { $match: leadMatch },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const funnel = STATUS_ORDER.map((s) => ({
    stage: s,
    count: leadStatusAgg.find((x) => x._id === s)?.count || 0,
  }));

  // Revenue by month (closed won deals, last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  const revenueAgg = await Deal.aggregate([
    { $match: { ...dealMatch, stage: CLOSED_WON, updatedAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
        revenue: { $sum: '$value' },
      },
    },
  ]);
  const revenueByMonth = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const found = revenueAgg.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1);
    revenueByMonth.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: found?.revenue || 0,
    });
  }

  // Agent performance (admin only — agents get empty)
  let agentPerformance = [];
  if (!req.isAgent) {
    const agents = await User.find({ workspaceId: req.workspace._id, role: 'agent' }).select('name').lean();
    agentPerformance = await Promise.all(
      agents.map(async (a) => {
        const [leads, won, lost, revAgg] = await Promise.all([
          Lead.countDocuments({ workspaceId: req.workspace._id, assignedAgentId: a._id }),
          Deal.countDocuments({ workspaceId: req.workspace._id, assignedAgentId: a._id, stage: CLOSED_WON }),
          Deal.countDocuments({ workspaceId: req.workspace._id, assignedAgentId: a._id, stage: CLOSED_LOST }),
          Deal.aggregate([
            { $match: { workspaceId: req.workspace._id, assignedAgentId: a._id, stage: CLOSED_WON } },
            { $group: { _id: null, revenue: { $sum: '$value' } } },
          ]),
        ]);
        const closed = won + lost;
        return {
          agentId: a._id,
          name: a.name,
          leads,
          dealsClosed: won,
          winRate: closed ? Math.round((won / closed) * 100) : 0,
          revenue: revAgg[0]?.revenue || 0,
        };
      })
    );
  }

  res.json({ success: true, data: { funnel, revenueByMonth, agentPerformance } });
});

// GET /api/dashboard/leaderboard (Enterprise, admin)
const leaderboard = asyncHandler(async (req, res) => {
  const agents = await User.find({ workspaceId: req.workspace._id, role: 'agent' }).select('name').lean();
  const rows = await Promise.all(
    agents.map(async (a) => {
      const [won, lost, revAgg] = await Promise.all([
        Deal.countDocuments({ workspaceId: req.workspace._id, assignedAgentId: a._id, stage: CLOSED_WON }),
        Deal.countDocuments({ workspaceId: req.workspace._id, assignedAgentId: a._id, stage: CLOSED_LOST }),
        Deal.aggregate([
          { $match: { workspaceId: req.workspace._id, assignedAgentId: a._id, stage: CLOSED_WON } },
          { $group: { _id: null, revenue: { $sum: '$value' } } },
        ]),
      ]);
      const revenue = revAgg[0]?.revenue || 0;
      const closed = won + lost;
      return {
        agentId: a._id,
        name: a.name,
        dealsClosed: won,
        revenue,
        winRate: closed ? Math.round((won / closed) * 100) : 0,
        avgDealSize: won ? Math.round(revenue / won) : 0,
      };
    })
  );
  rows.sort((a, b) => b.revenue - a.revenue);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  res.json({ success: true, data: { items: rows } });
});

// GET /api/dashboard/forecast (Enterprise)
const forecast = asyncHandler(async (req, res) => {
  const dealMatch = match(req);
  // last 3 months actual revenue
  const actual = [];
  for (let i = 2; i >= 0; i -= 1) {
    const start = new Date();
    start.setMonth(start.getMonth() - i, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const agg = await Deal.aggregate([
      { $match: { ...dealMatch, stage: CLOSED_WON, updatedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, revenue: { $sum: '$value' } } },
    ]);
    actual.push({
      month: start.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: agg[0]?.revenue || 0,
      type: 'actual',
    });
  }

  // linear regression on the 3 actual points → project next 3
  const xs = [0, 1, 2];
  const ys = actual.map((a) => a.revenue);
  const n = 3;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom ? (n * sumXY - sumX * sumY) / denom : 0;
  const intercept = (sumY - slope * sumX) / n;

  const projected = [];
  for (let i = 3; i <= 5; i += 1) {
    const d = new Date();
    d.setMonth(d.getMonth() + (i - 2), 1);
    projected.push({
      month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      revenue: Math.max(0, Math.round(intercept + slope * i)),
      type: 'projected',
    });
  }

  res.json({ success: true, data: { actual, projected } });
});

module.exports = { stats, activity, upcoming, analytics, leaderboard, forecast };
