const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema(
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
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    title: { type: String, required: true, trim: true },
    value: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    stage: {
      type: String,
      enum: ['Prospect', 'Proposal', 'Negotiation', 'Legal', 'Closed Won', 'Closed Lost'],
      default: 'Prospect',
    },
    expectedCloseDate: { type: Date },
    notes: { type: String, trim: true },
    clientPortalToken: { type: String, unique: true, sparse: true, index: true },
    clientPortalEnabled: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dealSchema.index({ workspaceId: 1, stage: 1 });

// Auto-calculate 2% commission when value changes (if not explicitly set)
dealSchema.pre('save', function calcCommission(next) {
  if (this.isModified('value')) {
    this.commission = Math.round((this.value || 0) * 0.02);
  }
  next();
});

module.exports = mongoose.model('Deal', dealSchema);
