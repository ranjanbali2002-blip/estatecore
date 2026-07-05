const mongoose = require('mongoose');

/**
 * Durable record of any inbound webhook that failed to process, so nothing
 * silently disappears. Kept small; inspect + retry manually if needed.
 */
const failedWebhookSchema = new mongoose.Schema({
  source: { type: String, default: 'meta', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' },
  leadgenId: { type: String, index: true },
  pageId: { type: String },
  formId: { type: String },
  error: { type: String },
  rawPayload: { type: mongoose.Schema.Types.Mixed },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('FailedWebhook', failedWebhookSchema);
