const logger = require('./logger');

/**
 * Validates required environment variables on startup.
 * Crashes the process (exit 1) if any required var is missing.
 * Razorpay vars are only required when PAYMENTS_ENABLED === 'true'.
 */
function validateEnv() {
  const required = [
    'NODE_ENV',
    'PORT',
    'FRONTEND_URL',
    'MONGODB_URI',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'ARCHITECT_TOKEN_SECRET',
    'ACCESS_TOKEN_EXPIRY',
    'REFRESH_TOKEN_EXPIRY',
    'ARCHITECT_EMAIL',
    'ARCHITECT_PASSWORD',
    'ARCHITECT_WHATSAPP',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM',
  ];

  const paymentsEnabled = process.env.PAYMENTS_ENABLED === 'true';
  const razorpayRequired = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'RAZORPAY_PLAN_STARTER_ID',
    'RAZORPAY_PLAN_PRO_ID',
    'RAZORPAY_PLAN_ENTERPRISE_ID',
  ];

  // Meta (Facebook/Instagram) Lead Ads — only required when META_ENABLED === 'true'
  const metaEnabled = process.env.META_ENABLED === 'true';
  const metaRequired = ['META_APP_ID', 'META_APP_SECRET', 'META_VERIFY_TOKEN', 'META_ENCRYPTION_KEY'];

  const toCheck = [
    ...required,
    ...(paymentsEnabled ? razorpayRequired : []),
    ...(metaEnabled ? metaRequired : []),
  ];

  const missing = toCheck.filter((key) => {
    const v = process.env[key];
    return v === undefined || v === null || String(v).trim() === '';
  });

  if (missing.length > 0) {
    logger.error('Missing required environment variables. Server cannot start.', {
      missing,
      paymentsEnabled,
    });
    // eslint-disable-next-line no-console
    console.error('\n❌ Missing required environment variables:\n');
    missing.forEach((k) => console.error(`   - ${k}`));
    console.error('\nCopy .env.example to .env and fill the values.\n');
    process.exit(1);
  }

  // Validate password strength for architect (defense in depth)
  const pwd = process.env.ARCHITECT_PASSWORD;
  if (pwd.length < 8) {
    logger.error('ARCHITECT_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  logger.info('Environment validation passed.', { paymentsEnabled, metaEnabled });
}

module.exports = validateEnv;
