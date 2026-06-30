const mongoose = require('mongoose');

const billingEventSchema = new mongoose.Schema({
  razorpayEventId: { type: String, required: true, unique: true },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
  },
  event: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed },
  processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BillingEvent', billingEventSchema);
