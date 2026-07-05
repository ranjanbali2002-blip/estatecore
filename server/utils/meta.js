const crypto = require('crypto');
const logger = require('./logger');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

function isEnabled() {
  return process.env.META_ENABLED === 'true';
}

/** Verify the X-Hub-Signature-256 header against the raw request body. */
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', process.env.META_APP_SECRET).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch (e) {
    return false;
  }
}

async function graphGet(path, params = {}) {
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Graph GET ${path} failed`;
    const err = new Error(msg);
    err.graph = data?.error;
    throw err;
  }
  return data;
}

async function graphPost(path, params = {}) {
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || `Graph POST ${path} failed`;
    const err = new Error(msg);
    err.graph = data?.error;
    throw err;
  }
  return data;
}

/** Build the Facebook OAuth dialog URL the admin is sent to. */
function buildOAuthUrl({ redirectUri, state }) {
  const scope = [
    'pages_show_list',
    'pages_manage_metadata',
    'pages_read_engagement',
    'leads_retrieval',
    'business_management',
  ].join(',');
  const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
  url.searchParams.set('client_id', process.env.META_APP_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  return url.toString();
}

/** Exchange an OAuth code for a short-lived user access token. */
async function exchangeCodeForToken(code, redirectUri) {
  const data = await graphGet('/oauth/access_token', {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: redirectUri,
    code,
  });
  return data.access_token;
}

/** Upgrade a short-lived user token to a long-lived one (~60 days). */
async function getLongLivedUserToken(shortToken) {
  const data = await graphGet('/oauth/access_token', {
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    fb_exchange_token: shortToken,
  });
  return data.access_token;
}

/** List the Pages the user manages, each with its own (long-lived) page access token. */
async function getUserPages(userAccessToken) {
  const data = await graphGet('/me/accounts', {
    access_token: userAccessToken,
    fields: 'id,name,access_token,instagram_business_account',
  });
  return (data.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    accessToken: p.access_token,
    igBusinessId: p.instagram_business_account?.id || null,
  }));
}

/** Subscribe a Page to our app's webhook for the `leadgen` field. */
function subscribePageToLeadgen(pageId, pageAccessToken) {
  return graphPost(`/${pageId}/subscribed_apps`, {
    subscribed_fields: 'leadgen',
    access_token: pageAccessToken,
  });
}

function unsubscribePage(pageId, pageAccessToken) {
  const url = new URL(`${GRAPH}/${pageId}/subscribed_apps`);
  url.searchParams.set('access_token', pageAccessToken);
  return fetch(url.toString(), { method: 'DELETE' }).catch((e) =>
    logger.warn('Meta unsubscribe failed', { pageId, error: e.message })
  );
}

/** Fetch the submitted field data for a lead by its leadgen id. */
async function getLeadData(leadgenId, pageAccessToken) {
  const data = await graphGet(`/${leadgenId}`, {
    access_token: pageAccessToken,
    fields: 'id,created_time,field_data,form_id,platform',
  });
  return data;
}

/** List the Lead Ad forms on a Page (id, name, status). */
async function getPageForms(pageId, pageAccessToken) {
  const data = await graphGet(`/${pageId}/leadgen_forms`, {
    access_token: pageAccessToken,
    fields: 'id,name,status',
    limit: 100,
  });
  return (data.data || []).map((f) => ({ id: f.id, name: f.name, status: f.status }));
}

const MATCHERS = {
  name: ['full_name', 'full name', 'name'],
  phone: ['phone', 'mobile', 'contact_number', 'contact'],
  email: ['email'],
  budget: ['budget', 'price'],
  location: ['location', 'locality', 'city', 'area', 'preferred_city', 'neighbourhood', 'neighborhood'],
};

/**
 * Maps Meta field_data ([{name, values:[]}]) to EstateCore lead fields.
 * Known questions map to real columns; every other question is preserved
 * verbatim in `customFields` (nothing is dropped).
 */
function mapLeadFields(fieldData = []) {
  const matched = new Set();
  const first = (keys) => {
    const f = fieldData.find((x) => keys.some((k) => x.name?.toLowerCase().includes(k)));
    if (f) matched.add(f.name);
    return f?.values?.[0];
  };

  const name = first(MATCHERS.name) || 'Meta Lead';
  const phone = first(MATCHERS.phone) || '';
  const email = first(MATCHERS.email) || '';
  const budget = Number(String(first(MATCHERS.budget) || '').replace(/[^0-9]/g, '')) || 0;
  const location = first(MATCHERS.location) || '';

  const customFields = {};
  for (const f of fieldData) {
    if (!matched.has(f.name)) customFields[f.name] = (f.values || []).join(', ');
  }

  return { name, phone, email, budget, locationInterest: location, customFields };
}

module.exports = {
  isEnabled,
  GRAPH_VERSION,
  verifyWebhookSignature,
  buildOAuthUrl,
  exchangeCodeForToken,
  getLongLivedUserToken,
  getUserPages,
  subscribePageToLeadgen,
  unsubscribePage,
  getLeadData,
  getPageForms,
  mapLeadFields,
};
