const User = require('../models/User');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../utils/email');
const { agentWelcome } = require('../utils/emailTemplates');

async function statsFor(workspaceId, agentId) {
  const [leadsAssigned, dealsClosed, tasksCompleted] = await Promise.all([
    Lead.countDocuments({ workspaceId, assignedAgentId: agentId }),
    Deal.countDocuments({ workspaceId, assignedAgentId: agentId, stage: 'Closed Won' }),
    Task.countDocuments({ workspaceId, assignedAgentId: agentId, status: 'Completed' }),
  ]);
  return { leadsAssigned, dealsClosed, tasksCompleted };
}

// GET /api/agents
const list = asyncHandler(async (req, res) => {
  const agents = await User.find({ workspaceId: req.workspace._id, role: 'agent' })
    .sort({ createdAt: -1 })
    .lean();

  const withStats = await Promise.all(
    agents.map(async (a) => ({
      id: a._id,
      name: a.name,
      email: a.email,
      isActive: a.isActive,
      lastLoginAt: a.lastLoginAt,
      createdAt: a.createdAt,
      ...(await statsFor(req.workspace._id, a._id)),
    }))
  );

  const used = agents.length;
  res.json({
    success: true,
    data: { items: withStats, used, limit: req.workspace.agentLimit },
  });
});

// POST /api/agents
const create = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw AppError.badRequest('A user with this email already exists', 'VALIDATION_ERROR', [
    { field: 'email', message: 'Email already in use' },
  ]);

  const agent = await User.create({
    workspaceId: req.workspace._id,
    role: 'agent',
    name,
    email,
    password,
    isActive: true,
  });

  // Welcome email (non-blocking failure)
  await sendEmail({
    to: agent.email,
    ...agentWelcome({
      brand: req.workspace.brand,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      email: agent.email,
      password,
      addedBy: req.user.name,
    }),
  });

  res.status(201).json({
    success: true,
    data: { id: agent._id, name: agent.name, email: agent.email, isActive: agent.isActive },
  });
});

// PUT /api/agents/:id
const update = asyncHandler(async (req, res) => {
  const agent = await User.findOne({
    _id: req.params.id,
    workspaceId: req.workspace._id,
    role: 'agent',
  });
  if (!agent) throw AppError.notFound('Agent not found');
  if (req.body.name !== undefined) agent.name = req.body.name;
  if (req.body.email !== undefined) agent.email = req.body.email;
  await agent.save();
  res.json({ success: true, data: { id: agent._id, name: agent.name, email: agent.email } });
});

// PUT /api/agents/:id/status
const setStatus = asyncHandler(async (req, res) => {
  const agent = await User.findOne({
    _id: req.params.id,
    workspaceId: req.workspace._id,
    role: 'agent',
  });
  if (!agent) throw AppError.notFound('Agent not found');
  agent.isActive = !!req.body.isActive;
  await agent.save();
  res.json({ success: true, data: { id: agent._id, isActive: agent.isActive } });
});

// DELETE /api/agents/:id — reassign their records to the Admin, then remove
const remove = asyncHandler(async (req, res) => {
  const agent = await User.findOne({
    _id: req.params.id,
    workspaceId: req.workspace._id,
    role: 'agent',
  });
  if (!agent) throw AppError.notFound('Agent not found');

  const adminId = req.workspace.adminId;
  await Promise.all([
    Lead.updateMany(
      { workspaceId: req.workspace._id, assignedAgentId: agent._id },
      { $set: { assignedAgentId: adminId } }
    ),
    Deal.updateMany(
      { workspaceId: req.workspace._id, assignedAgentId: agent._id },
      { $set: { assignedAgentId: adminId } }
    ),
    Task.updateMany(
      { workspaceId: req.workspace._id, assignedAgentId: agent._id },
      { $set: { assignedAgentId: adminId } }
    ),
  ]);

  await User.deleteOne({ _id: agent._id });
  res.json({ success: true, data: { id: agent._id, reassignedTo: adminId } });
});

// GET /api/agents/:id/stats
const getStats = asyncHandler(async (req, res) => {
  const agent = await User.findOne({
    _id: req.params.id,
    workspaceId: req.workspace._id,
    role: 'agent',
  });
  if (!agent) throw AppError.notFound('Agent not found');
  res.json({ success: true, data: await statsFor(req.workspace._id, agent._id) });
});

module.exports = { list, create, update, setStatus, remove, getStats };
