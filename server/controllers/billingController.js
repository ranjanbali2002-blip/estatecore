const Workspace = require('../models/Workspace');
const User = require('../models/User');
const BillingEvent = require('../models/BillingEvent');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { getClient, planIdFor, verifyWebhookSignature } = require('../utils/razorpay');
const { getAgentLimit, PLANS } = require('../utils/plans');
const { sendEmail } = require('../utils/email');
const { paymentFailed, subscriptionCancelled, trialWelcome } = require('../utils/emailTemplates');

// GET /api/billing/status — works in both phases
const status = asyncHandler(async (req, res) => {
  const ws = req.workspace;
  res.json({
    success: true,
    data: {
      paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
      mode: ws.trial?.enabled ? 'trial' : 'paid',
      plan: ws.plan,
      effectivePlan: ws.getEffectivePlan(),
      trial: ws.trial,
      status: ws.getEffectiveStatus(),
      agentLimit: ws.agentLimit,
      razorpay: { status: ws.razorpay?.status, currentPeriodEnd: ws.razorpay?.currentPeriodEnd },
      plans: PLANS,
    },
  });
});

// POST /api/billing/create-subscription  (PAYMENTS_ENABLED only)
const createSubscription = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!['starter', 'pro', 'enterprise'].includes(plan)) throw AppError.badRequest('Invalid plan');
  const planId = planIdFor(plan);
  if (!planId) throw AppError.badRequest('Plan not configured');

  const client = getClient();
  const ws = await Workspace.findById(req.workspace._id);

  // create/fetch customer
  let customerId = ws.razorpay?.customerId;
  if (!customerId) {
    const admin = await User.findById(ws.adminId);
    const customer = await client.customers.create({
      name: admin.name,
      email: admin.email,
      fail_existing: 0,
    });
    customerId = customer.id;
  }

  const subscription = await client.subscriptions.create({
    plan_id: planId,
    customer_notify: 1,
    total_count: 12,
    notes: { workspaceId: ws._id.toString(), plan },
  });

  ws.razorpay = {
    ...ws.razorpay,
    subscriptionId: subscription.id,
    customerId,
    planId,
    status: subscription.status,
  };
  await ws.save();

  res.json({
    success: true,
    data: { subscriptionId: subscription.id, razorpayKeyId: process.env.RAZORPAY_KEY_ID },
  });
});

// GET /api/billing/history
const history = asyncHandler(async (req, res) => {
  if (process.env.PAYMENTS_ENABLED !== 'true') {
    return res.json({ success: true, data: { events: [] } });
  }
  const events = await BillingEvent.find({ workspaceId: req.workspace._id })
    .sort({ processedAt: -1 })
    .limit(100)
    .lean();
  res.json({ success: true, data: { events } });
});

// POST /api/billing/cancel
const cancel = asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.workspace._id);
  if (!ws.razorpay?.subscriptionId) throw AppError.badRequest('No active subscription');
  const client = getClient();
  await client.subscriptions.cancel(ws.razorpay.subscriptionId, { cancel_at_cycle_end: 1 });
  ws.razorpay.status = 'cancelled';
  await ws.save();
  res.json({ success: true, data: { status: 'cancelled' } });
});

// POST /api/billing/upgrade
const upgrade = asyncHandler(async (req, res) => {
  // Upgrading = create a new subscription on the higher plan.
  return createSubscription(req, res);
});

/**
 * POST /api/billing/webhook  — raw body, signature verified.
 * Mounted with express.raw, NOT json. Idempotent via BillingEvent.
 */
const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer (express.raw)
  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Razorpay webhook signature invalid');
    return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'bad signature' } });
  }

  const payload = JSON.parse(rawBody.toString('utf8'));
  const eventId = req.headers['x-razorpay-event-id'] || payload?.payload?.subscription?.entity?.id + ':' + payload.event;
  const event = payload.event;

  // Idempotency
  const existing = await BillingEvent.findOne({ razorpayEventId: eventId });
  if (existing) {
    return res.json({ success: true, data: { duplicate: true } });
  }

  const subEntity = payload?.payload?.subscription?.entity;
  const workspaceId = subEntity?.notes?.workspaceId || null;

  await BillingEvent.create({
    razorpayEventId: eventId,
    workspaceId,
    event,
    payload,
    processedAt: new Date(),
  });

  try {
    await processWebhookEvent(event, payload);
  } catch (err) {
    logger.error('Webhook processing error', { event, error: err.message });
  }

  return res.json({ success: true, data: { received: true } });
});

async function processWebhookEvent(event, payload) {
  const subEntity = payload?.payload?.subscription?.entity;
  const workspaceId = subEntity?.notes?.workspaceId;
  const plan = subEntity?.notes?.plan || 'starter';

  switch (event) {
    case 'subscription.activated': {
      if (workspaceId) {
        const ws = await Workspace.findById(workspaceId);
        if (ws) {
          ws.trial.enabled = false;
          ws.plan = plan;
          ws.agentLimit = getAgentLimit(plan);
          ws.status = 'active';
          ws.razorpay = {
            ...ws.razorpay,
            subscriptionId: subEntity.id,
            status: 'active',
            currentPeriodEnd: subEntity.current_end ? new Date(subEntity.current_end * 1000) : undefined,
          };
          await ws.save();
        }
      }
      break;
    }
    case 'subscription.charged': {
      if (workspaceId) {
        await Workspace.findByIdAndUpdate(workspaceId, {
          status: 'active',
          'razorpay.status': 'active',
          'razorpay.currentPeriodEnd': subEntity?.current_end
            ? new Date(subEntity.current_end * 1000)
            : undefined,
        });
      }
      break;
    }
    case 'subscription.cancelled': {
      if (workspaceId) {
        const ws = await Workspace.findById(workspaceId).populate('adminId', 'email');
        if (ws) {
          ws.status = 'inactive';
          ws.razorpay.status = 'cancelled';
          await ws.save();
          await sendEmail({
            to: ws.adminId.email,
            ...subscriptionCancelled({
              brand: ws.brand,
              periodEnd: ws.razorpay.currentPeriodEnd,
              resubscribeUrl: `${process.env.FRONTEND_URL}/billing`,
            }),
          });
        }
      }
      break;
    }
    case 'payment.failed':
    case 'subscription.halted': {
      if (workspaceId) {
        const ws = await Workspace.findById(workspaceId).populate('adminId', 'email');
        if (ws) {
          ws.status = 'payment_failed';
          ws.razorpay.status = 'paused';
          await ws.save();
          await sendEmail({
            to: ws.adminId.email,
            ...paymentFailed({ brand: ws.brand, retryUrl: `${process.env.FRONTEND_URL}/billing` }),
          });
        }
      }
      break;
    }
    default:
      logger.info('Unhandled Razorpay event', { event });
  }
}

module.exports = { status, createSubscription, history, cancel, upgrade, webhook };
