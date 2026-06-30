const User = require('../models/User');
const logger = require('./logger');

/**
 * Ensures the Architect account exists and matches the .env credentials.
 * Runs on every startup. The architect has no workspace (God Mode).
 */
async function bootstrapArchitect() {
  const email = process.env.ARCHITECT_EMAIL.toLowerCase().trim();
  const password = process.env.ARCHITECT_PASSWORD;

  let architect = await User.findOne({ email }).select('+password');
  if (!architect) {
    architect = await User.create({
      role: 'architect',
      name: 'Architect',
      email,
      password,
      workspaceId: null,
      isActive: true,
    });
    logger.info('Architect account created', { email });
    return architect;
  }

  // Keep role/active correct; refresh password to match env (single source of truth)
  let changed = false;
  if (architect.role !== 'architect') {
    architect.role = 'architect';
    changed = true;
  }
  if (!architect.isActive) {
    architect.isActive = true;
    changed = true;
  }
  // Always reset password to env value so it stays authoritative
  architect.password = password;
  changed = true;

  if (changed) {
    architect.loginAttempts = 0;
    architect.lockUntil = undefined;
    await architect.save();
    logger.info('Architect account synced from env', { email });
  }
  return architect;
}

module.exports = bootstrapArchitect;
