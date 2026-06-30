const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function signAccessToken(user) {
  const secret =
    user.role === 'architect'
      ? process.env.ARCHITECT_TOKEN_SECRET
      : process.env.ACCESS_TOKEN_SECRET;
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      workspaceId: user.workspaceId ? user.workspaceId.toString() : null,
    },
    secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
}

function verifyAccessToken(token, role) {
  const secret =
    role === 'architect'
      ? process.env.ARCHITECT_TOKEN_SECRET
      : process.env.ACCESS_TOKEN_SECRET;
  return jwt.verify(token, secret);
}

/** Try architect secret first, then standard — used when role is unknown. */
function verifyAnyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (e) {
    return jwt.verify(token, process.env.ARCHITECT_TOKEN_SECRET);
  }
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/**
 * Issues a refresh token: signs a JWT, stores its hash, returns raw token.
 */
async function issueRefreshToken(user) {
  const raw = jwt.sign({ sub: user._id.toString() }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d',
  });
  const tokenHash = hashToken(raw);
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
  return raw;
}

/**
 * Validates a refresh token against DB, rotates it (deletes old, issues new).
 * Returns { user, newToken } or throws.
 */
async function rotateRefreshToken(raw) {
  const payload = jwt.verify(raw, process.env.REFRESH_TOKEN_SECRET);
  const tokenHash = hashToken(raw);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) {
    const err = new Error('Refresh token not recognized');
    err.code = 'REFRESH_INVALID';
    throw err;
  }
  // Invalidate immediately (rotation)
  await RefreshToken.deleteOne({ _id: stored._id });
  return { userId: payload.sub };
}

async function revokeRefreshToken(raw) {
  if (!raw) return;
  const tokenHash = hashToken(raw);
  await RefreshToken.deleteOne({ tokenHash });
}

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  // In production the frontend (Vercel) and backend (Render) are on different
  // sites, so the cookie must be SameSite=None + Secure to be sent cross-site.
  // Locally everything is same-site over http, so Strict + non-secure works.
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge: REFRESH_TTL_MS,
    path: '/api/auth',
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  verifyAnyAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  refreshCookieOptions,
  hashToken,
  REFRESH_TTL_MS,
};
