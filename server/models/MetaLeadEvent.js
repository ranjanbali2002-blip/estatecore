const mongoose = require('mongoose');

/**
 * Idempotency + audit record for incoming Meta lead webhooks.
 * Meta can deliver the same leadgen event more than once, so we key on leadgenId.
 */
const metaLeadEventSchema = new mongoose.Schema({
  leadgenId: { type: String, required: true, unique: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  pageId: { type: String },
  formId: { type: String },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }, // the Lead we created
  status: { type: String, enum: ['created', 'skipped', 'error'], default: 'created' },
  error: { type: String },
  processedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MetaLeadEvent', metaLeadEventSchema);
