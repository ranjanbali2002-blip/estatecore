const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const PAGE_SIZE = 50;

function scopeFilter(req, base = {}) {
  const filter = { workspaceId: req.workspace._id, ...base };
  if (req.isAgent) filter.assignedAgentId = req.user._id;
  return filter;
}

const list = asyncHandler(async (req, res) => {
  const { status, priority, agent, search, page = 1 } = req.query;
  const extra = {};
  if (status) extra.status = { $in: String(status).split(',') };
  if (priority) extra.priority = { $in: String(priority).split(',') };
  if (agent) extra.assignedAgentId = agent;
  const filter = scopeFilter(req, extra);
  if (search) {
    const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.title = rx;
  }
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const [items, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedAgentId', 'name email')
      .populate('leadId', 'name')
      .sort({ dueDate: 1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Task.countDocuments(filter),
  ]);
  res.json({ success: true, data: { items, total, page: pageNum, pageSize: PAGE_SIZE } });
});

const getOne = asyncHandler(async (req, res) => {
  const task = await Task.findOne(scopeFilter(req, { _id: req.params.id }))
    .populate('assignedAgentId', 'name email')
    .populate('leadId', 'name phone');
  if (!task) throw AppError.notFound('Task not found');
  res.json({ success: true, data: task });
});

const create = asyncHandler(async (req, res) => {
  const b = req.body;
  const task = await Task.create({
    workspaceId: req.workspace._id,
    title: b.title,
    dueDate: b.dueDate,
    priority: b.priority || 'Medium',
    leadId: b.leadId || null,
    assignedAgentId: req.isAgent ? req.user._id : b.assignedAgentId || null,
    notes: b.notes,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: task });
});

const update = asyncHandler(async (req, res) => {
  const task = await Task.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!task) throw AppError.notFound('Task not found');
  const editable = ['title', 'dueDate', 'priority', 'leadId', 'notes', 'status'];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) task[f] = req.body[f];
  });
  if (req.body.status === 'Completed' && !task.completedAt) task.completedAt = new Date();
  if (req.body.status === 'Pending') task.completedAt = undefined;
  if (!req.isAgent && req.body.assignedAgentId !== undefined) {
    task.assignedAgentId = req.body.assignedAgentId || null;
  }
  await task.save();
  res.json({ success: true, data: task });
});

// PATCH /api/tasks/:id/complete
const toggleComplete = asyncHandler(async (req, res) => {
  const task = await Task.findOne(scopeFilter(req, { _id: req.params.id }));
  if (!task) throw AppError.notFound('Task not found');
  const completed = req.body.completed !== undefined ? !!req.body.completed : task.status !== 'Completed';
  task.status = completed ? 'Completed' : 'Pending';
  task.completedAt = completed ? new Date() : undefined;
  await task.save();
  res.json({ success: true, data: task });
});

const remove = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ workspaceId: req.workspace._id, _id: req.params.id });
  if (!task) throw AppError.notFound('Task not found');
  res.json({ success: true, data: { id: task._id } });
});

module.exports = { list, getOne, create, update, toggleComplete, remove };
