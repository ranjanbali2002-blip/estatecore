const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'pro', 'enterprise'],
      default: 'starter',
      index: true,
    },
    agentLimit: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial_expired', 'payment_failed'],
      default: 'active',
      index: true,
    },

    trial: {
      enabled: { type: Boolean, default: false },
      plan: {
        type: String,
        enum: ['starter', 'pro', 'enterprise'],
        default: 'pro',
      },
      expiresAt: { type: Date, index: true },
      createdByArchitect: { type: Boolean, default: true },
      reminderSent3Day: { type: Boolean, default: false },
      reminderSent1Day: { type: Boolean, default: false },
      expiredEmailSent: { type: Boolean, default: false },
    },

    razorpay: {
      subscriptionId: { type: String },
      customerId: { type: String },
      planId: { type: String },
      currentPeriodEnd: { type: Date },
      status: {
        type: String,
        enum: [
          'created',
          'authenticated',
          'active',
          'paused',
          'cancelled',
          'completed',
          'expired',
        ],
      },
    },

    brand: {
      name: { type: String, default: 'EstateCore', trim: true },
      logoUrl: { type: String },
      logoPublicId: { type: String },
      accentColor: { type: String, default: '#C9A84C' },
      supportEmail: { type: String, trim: true, lowercase: true },
      subdomain: { type: String, trim: true, lowercase: true },
    },

    aiAddon: {
      enabled: { type: Boolean, default: false },
      callsUsed: { type: Number, default: 0 },
      callsLimit: { type: Number, default: 0 },
      resetDate: { type: Date },
    },
  },
  { timestamps: true }
);

/**
 * Returns the plan that should drive feature gates right now.
 * During an active trial that is the trial plan, otherwise the real plan.
 */
workspaceSchema.methods.getEffectivePlan = function getEffectivePlan() {
  if (this.trial?.enabled && this.trial.expiresAt && Date.now() < this.trial.expiresAt.getTime()) {
    return this.trial.plan;
  }
  return this.plan;
};

/**
 * Computed status — a trial workspace past expiry is trial_expired
 * regardless of the stored value (cron may not have run yet).
 */
workspaceSchema.methods.getEffectiveStatus = function getEffectiveStatus() {
  if (
    this.trial?.enabled &&
    this.trial.expiresAt &&
    Date.now() > this.trial.expiresAt.getTime()
  ) {
    return 'trial_expired';
  }
  return this.status;
};

module.exports = mongoose.model('Workspace', workspaceSchema);
