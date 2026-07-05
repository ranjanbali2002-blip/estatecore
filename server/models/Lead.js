const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const callLogSchema = new mongoose.Schema(
  {
    outcome: {
      type: String,
      enum: ['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Voicemail'],
      required: true,
    },
    duration: { type: Number, default: 0 },
    notes: { type: String, trim: true },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
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
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    budget: { type: Number, default: 0 },
    propertyType: {
      type: String,
      enum: ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'],
    },
    locationInterest: { type: String, trim: true },
    source: {
      type: String,
      enum: ['Website', 'Referral', 'Instagram', 'Facebook', 'Walk-in', 'Other'],
      default: 'Other',
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Won', 'Lost'],
      default: 'New',
    },
    notes: [noteSchema],
    callLog: [callLogSchema],
    // Unmapped lead-form questions (e.g. from Meta Lead Ads custom questions)
    customFields: { type: Map, of: String, default: undefined },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

leadSchema.index({ workspaceId: 1, status: 1 });
leadSchema.index({ workspaceId: 1, source: 1 });
leadSchema.index({ workspaceId: 1, createdAt: -1 });
leadSchema.index({ workspaceId: 1, budget: -1 });

module.exports = mongoose.model('Lead', leadSchema);
