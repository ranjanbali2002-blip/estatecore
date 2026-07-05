const jwt = require('jsonwebtoken');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Lead = require('../models/Lead');
const MetaLeadEvent = require('../models/MetaLeadEvent');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const meta = require('../utils/meta');

const REDIRECT_PATH = '/integrations/meta/callback';

// Short-lived server-side cache of a workspace's fetched Pages (with tokens),
// so page access tokens are never sent to the browser during the connect flow.
const pageCache = new Map(); // workspaceId -> { pages, expires }
function cachePages(workspaceId, pages) {
  pageCache.set(String(workspaceId), { pages, expires: Date.now() + 10 * 60 * 1000 });
}
function readPages(workspaceId) {
  const entry = pageCache.get(String(workspaceId));
  if (!entry || entry.expires < Date.now()) {
    pageCache.delete(String(workspaceId));
    return null;
  }
  return entry.pages;
}

function redirectUri() {
  return `${process.env.FRONTEND_URL}${REDIRECT_PATH}`;
}

// GET /api/workspace/meta — connection status (admin)
const status = asyncHandler(async (req, res) => {
  const m = req.workspace.meta || {};
  res.json({
    success: true,
    data: {
      enabled: meta.isEnabled(),
      connected: !!m.connected,
      pageId: m.pageId || null,
      pageName: m.pageName || null,
      defaultAgentId: m.defaultAgentId || null,
      leadCount: m.leadCount || 0,
      lastLeadAt: m.lastLeadAt || null,
      connectedAt: m.connectedAt || null,
      webhookUrl: `${process.env.FRONTEND_URL ? '' : ''}${req.protocol}://${req.get('host')}/api/webhooks/meta-leads`,
    },
  });
});

// GET /api/workspace/meta/connect-url — start OAuth (admin)
const connectUrl = asyncHandler(async (req, res) => {
  const state = jwt.sign({ workspaceId: req.workspace._id.toString() }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '10m',
  });
  res.json({ success: true, data: { url: meta.buildOAuthUrl({ redirectUri: redirectUri(), state }) } });
});

// POST /api/workspace/meta/exchange — { code, state } → returns the user's Pages (admin)
const exchangeCode = asyncHandler(async (req, res) => {
  const { code, state } = req.body;
  if (!code) throw AppError.badRequest('Missing code');

  // CSRF: the state must belong to this workspace
  try {
    const decoded = jwt.verify(state, process.env.ACCESS_TOKEN_SECRET);
    if (decoded.workspaceId !== req.workspace._id.toString()) {
      throw AppError.forbidden('State mismatch');
    }
  } catch (e) {
    throw AppError.forbidden('Invalid or expired connect state');
  }

  const shortToken = await meta.exchangeCodeForToken(code, redirectUri());
  const userToken = await meta.getLongLivedUserToken(shortToken);
  const pages = await meta.getUserPages(userToken);
  if (!pages.length) {
    throw AppError.badRequest('No Facebook Pages found on this account. Create/manage a Page first.');
  }

  cachePages(req.workspace._id, pages);
  res.json({
    success: true,
    data: { pages: pages.map((p) => ({ id: p.id, name: p.name, hasInstagram: !!p.igBusinessId })) },
  });
});

// POST /api/workspace/meta/select-page — { pageId } (admin)
const selectPage = asyncHandler(async (req, res) => {
  const { pageId } = req.body;
  const pages = readPages(req.workspace._id);
  if (!pages) throw AppError.badRequest('Connect session expired — please connect Facebook again');
  const page = pages.find((p) => p.id === pageId);
  if (!page) throw AppError.badRequest('Page not found in your connected account');

  // Subscribe the Page to our app webhook for leadgen events
  await meta.subscribePageToLeadgen(page.id, page.accessToken);

  const ws = await Workspace.findById(req.workspace._id);
  ws.meta.connected = true;
  ws.meta.pageId = page.id;
  ws.meta.pageName = page.name;
  ws.meta.pageAccessToken = page.accessToken;
  ws.meta.igBusinessId = page.igBusinessId || undefined;
  ws.meta.connectedAt = new Date();
  await ws.save();

  pageCache.delete(String(req.workspace._id));
  logger.info('Meta page connected', { workspaceId: ws._id.toString(), pageId: page.id });
  res.json({ success: true, data: { connected: true, pageName: page.name } });
});

// POST /api/workspace/meta/manual — { pageId, pageAccessToken } advanced/testing fallback (admin)
const manualConnect = asyncHandler(async (req, res) => {
  const { pageId, pageAccessToken } = req.body;
  if (!pageId || !pageAccessToken) throw AppError.badRequest('pageId and pageAccessToken are required');

  // Verify the token works and subscribe
  await meta.subscribePageToLeadgen(pageId, pageAccessToken);

  const ws = await Workspace.findById(req.workspace._id);
  ws.meta.connected = true;
  ws.meta.pageId = pageId;
  ws.meta.pageName = req.body.pageName || `Page ${pageId}`;
  ws.meta.pageAccessToken = pageAccessToken;
  ws.meta.connectedAt = new Date();
  await ws.save();
  res.json({ success: true, data: { connected: true, pageName: ws.meta.pageName } });
});

// PUT /api/workspace/meta/default-agent — { agentId } (admin)
const setDefaultAgent = asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  const ws = await Workspace.findById(req.workspace._id);
  if (agentId) {
    const agent = await User.findOne({ _id: agentId, workspaceId: ws._id, role: 'agent' });
    if (!agent) throw AppError.badRequest('Agent not found in this workspace');
    ws.meta.defaultAgentId = agent._id;
  } else {
    ws.meta.defaultAgentId = undefined;
  }
  await ws.save();
  res.json({ success: true, data: { defaultAgentId: ws.meta.defaultAgentId || null } });
});

// POST /api/workspace/meta/disconnect (admin)
const disconnect = asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.workspace._id).select('+meta.pageAccessToken');
  if (ws.meta?.pageId && ws.meta?.pageAccessToken) {
    await meta.unsubscribePage(ws.meta.pageId, ws.meta.pageAccessToken);
  }
  ws.meta.connected = false;
  ws.meta.pageId = undefined;
  ws.meta.pageName = undefined;
  ws.meta.pageAccessToken = undefined;
  ws.meta.igBusinessId = undefined;
  ws.meta.defaultAgentId = undefined;
  await ws.save();
  res.json({ success: true, data: { connected: false } });
});

// ---- Public webhook (no auth) ----

// GET /api/webhooks/meta-leads — Meta verification handshake
const webhookVerify = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    logger.info('Meta webhook verified');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

// POST /api/webhooks/meta-leads — raw body; leadgen events
const webhookReceive = asyncHandler(async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.body; // Buffer (express.raw)
  if (!meta.verifyWebhookSignature(rawBody, signature)) {
    logger.warn('Meta webhook signature invalid');
    return res.sendStatus(403);
  }

  // Respond 200 immediately so Meta doesn't retry; process inline (fast).
  res.sendStatus(200);

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    logger.warn('Meta webhook: bad JSON');
    return;
  }
  if (payload.object !== 'page') return;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') continue;
      const v = change.value || {};
      try {
        await processLead(v);
      } catch (err) {
        logger.error('Meta lead processing failed', { leadgenId: v.leadgen_id, error: err.message });
        await MetaLeadEvent.updateOne(
          { leadgenId: v.leadgen_id },
          { $setOnInsert: { leadgenId: v.leadgen_id, status: 'error', error: err.message } },
          { upsert: true }
        ).catch(() => {});
      }
    }
  }
});

async function processLead(value) {
  const leadgenId = value.leadgen_id;
  const pageId = value.page_id;
  if (!leadgenId || !pageId) return;

  // Idempotency — skip if already seen
  const existing = await MetaLeadEvent.findOne({ leadgenId });
  if (existing) return;

  const ws = await Workspace.findOne({ 'meta.pageId': pageId, 'meta.connected': true }).select(
    '+meta.pageAccessToken'
  );
  if (!ws) {
    logger.warn('Meta lead for unknown/disconnected page', { pageId, leadgenId });
    await MetaLeadEvent.create({ leadgenId, pageId, status: 'skipped', error: 'no workspace' });
    return;
  }

  const detail = await meta.getLeadData(leadgenId, ws.meta.pageAccessToken);
  const mapped = meta.mapLeadFields(detail.field_data);
  const source = String(detail.platform || '').toLowerCase() === 'ig' ? 'Instagram' : 'Facebook';

  const lead = await Lead.create({
    workspaceId: ws._id,
    assignedAgentId: ws.meta.defaultAgentId || null,
    name: mapped.name,
    phone: mapped.phone,
    email: mapped.email,
    budget: mapped.budget,
    locationInterest: mapped.locationInterest,
    source,
    status: 'New',
    notes: mapped.rawNotes
      ? [{ text: `Captured from Meta Lead Ad:\n${mapped.rawNotes}`, createdBy: ws.adminId, createdAt: new Date() }]
      : [],
    createdBy: ws.adminId,
  });

  await MetaLeadEvent.create({
    leadgenId,
    workspaceId: ws._id,
    pageId,
    formId: value.form_id,
    leadId: lead._id,
    status: 'created',
  });

  await Workspace.updateOne(
    { _id: ws._id },
    { $inc: { 'meta.leadCount': 1 }, $set: { 'meta.lastLeadAt': new Date() } }
  );

  logger.info('Meta lead created', { workspaceId: ws._id.toString(), leadId: lead._id.toString(), source });
}

module.exports = {
  status,
  connectUrl,
  exchangeCode,
  selectPage,
  manualConnect,
  setDefaultAgent,
  disconnect,
  webhookVerify,
  webhookReceive,
};
