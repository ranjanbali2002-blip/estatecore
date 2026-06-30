const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true, index: true },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending',
    },
    notes: { type: String, trim: true },
    emailReminderSent: { type: Boolean, default: false },
    completedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ workspaceId: 1, assignedAgentId: 1 });
taskSchema.index({ workspaceId: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);
