const crypto = require('crypto');
const Razorpay = require('razorpay');
const logger = require('./logger');

let client;

/** Lazily build the Razorpay client. Only valid when PAYMENTS_ENABLED=true. */
function getClient() {
  if (process.env.PAYMENTS_ENABLED !== 'true') {
    throw new Error('Payments are not enabled');
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

function planIdFor(plan) {
  const map = {
    starter: process.env.RAZORPAY_PLAN_STARTER_ID,
    pro: process.env.RAZORPAY_PLAN_PRO_ID,
    enterprise: process.env.RAZORPAY_PLAN_ENTERPRISE_ID,
  };
  return map[plan];
}

/** Verify webhook signature using the configured webhook secret. */
function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || ''));
  } catch (err) {
    logger.warn('Webhook signature comparison failed', { error: err.message });
    return false;
  }
}

module.exports = { getClient, planIdFor, verifyWebhookSignature };
