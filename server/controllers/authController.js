const User = require('../models/User');
const Workspace = require('../models/Workspace');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const { trialRequestReceived, newTrialRequestArchitect } = require('../utils/emailTemplates');
const {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  refreshCookieOptions,
} = require('../utils/tokens');

const REFRESH_COOKIE = 'ec_refresh';

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

async function workspaceSummary(workspaceId) {
  if (!workspaceId) return null;
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return null;
  return {
    id: ws._id,
    plan: ws.plan,
    effectivePlan: ws.getEffectivePlan(),
    status: ws.getEffectiveStatus(),
    agentLimit: ws.agentLimit,
    trial: ws.trial,
    brand: ws.brand,
    razorpay: { status: ws.razorpay?.status, currentPeriodEnd: ws.razorpay?.currentPeriodEnd },
  };
}

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Uniform error to avoid user enumeration
  const invalid = () => {
    throw AppError.unauthorized('Invalid email or password');
  };

  if (!user) return invalid();

  if (user.isLocked) {
    throw AppError.forbidden(
      'Account temporarily locked due to too many failed attempts. Try again later.',
      'ACCOUNT_LOCKED'
    );
  }

  const match = await user.comparePassword(password);
  if (!match) {
    await user.registerFailedLogin();
    return invalid();
  }

  if (!user.isActive) {
    // Distinguish a pending self-registration from a deactivated account
    if (user.workspaceId) {
      const ws = await Workspace.findById(user.workspaceId).select('status signup');
      if (ws && ws.status === 'pending') {
        throw AppError.forbidden(
          'Your free trial request is pending approval. You will receive an email once it is approved.',
          'PENDING_APPROVAL'
        );
      }
    }
    throw AppError.forbidden('Your account has been deactivated');
  }

  await user.resetLoginState();

  const accessToken = signAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  res.json({
    success: true,
    data: {
      accessToken,
      user: publicUser(user),
      workspace: await workspaceSummary(user.workspaceId),
    },
  });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) throw AppError.unauthorized('No refresh token');

  let userId;
  try {
    ({ userId } = await rotateRefreshToken(raw));
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    throw AppError.unauthorized('Session expired, please log in again');
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    throw AppError.unauthorized('Session no longer valid');
  }

  const accessToken = signAccessToken(user);
  const newRefresh = await issueRefreshToken(user);
  res.cookie(REFRESH_COOKIE, newRefresh, refreshCookieOptions());

  res.json({
    success: true,
    data: {
      accessToken,
      user: publicUser(user),
      workspace: await workspaceSummary(user.workspaceId),
    },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  await revokeRefreshToken(raw);
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
  res.json({ success: true, data: { message: 'Logged out' } });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: publicUser(req.user),
      workspace: await workspaceSummary(req.user.workspaceId),
    },
  });
});

// POST /api/auth/register — public self-service trial request (awaits approval)
const registerTrial = asyncHandler(async (req, res) => {
  const { name, email, password, brandName, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.badRequest('An account with this email already exists', 'VALIDATION_ERROR', [
      { field: 'email', message: 'Email already registered' },
    ]);
  }

  // Create the admin as INACTIVE and the workspace as PENDING until an architect approves.
  const admin = await User.create({
    role: 'admin',
    name,
    email,
    password, // hashed once by the User pre-save hook
    isActive: false,
  });

  let workspace;
  try {
    workspace = await Workspace.create({
      adminId: admin._id,
      plan: 'starter',
      agentLimit: 2,
      status: 'pending',
      brand: { name: brandName, accentColor: '#C9A84C' },
      signup: { selfRegistered: true, phone: phone || undefined, requestedAt: new Date() },
    });
    admin.workspaceId = workspace._id;
    await admin.save();
  } catch (err) {
    await User.deleteOne({ _id: admin._id });
    throw err;
  }

  // Notify the applicant + the architect (best-effort)
  await sendEmail({
    to: email,
    ...trialRequestReceived({ brand: workspace.brand, name }),
  });
  if (process.env.ARCHITECT_EMAIL) {
    await sendEmail({
      to: process.env.ARCHITECT_EMAIL,
      ...newTrialRequestArchitect({
        brandName,
        name,
        email,
        phone,
        panelUrl: `${process.env.FRONTEND_URL}/architect/requests`,
      }),
    });
  }

  logger.info('Trial request registered', { email, brandName, workspaceId: workspace._id.toString() });
  res.status(201).json({
    success: true,
    data: { message: 'Registration received. Your trial is pending approval.', pending: true },
  });
});

module.exports = { login, refresh, logout, me, registerTrial, REFRESH_COOKIE, publicUser, workspaceSummary };
