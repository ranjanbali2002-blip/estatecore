const cron = require('node-cron');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const { trial3Day, trial1Day, trialExpired } = require('../utils/emailTemplates');

const DAY = 24 * 60 * 60 * 1000;

async function adminEmail(workspace) {
  const admin = await User.findById(workspace.adminId).select('email');
  return admin?.email;
}

async function runTrialReminders() {
  const now = new Date();
  let sent3 = 0;
  let sent1 = 0;
  let expired = 0;

  // Expiring in ~3 days (between 2 and 3 days out), not yet reminded
  const threeDayList = await Workspace.find({
    'trial.enabled': true,
    'trial.reminderSent3Day': false,
    'trial.expiresAt': { $gt: new Date(now.getTime() + 2 * DAY), $lte: new Date(now.getTime() + 3 * DAY) },
  });
  for (const ws of threeDayList) {
    const email = await adminEmail(ws);
    if (email) {
      await sendEmail({
        to: email,
        ...trial3Day({ brand: ws.brand, expiresAt: ws.trial.expiresAt, whatsapp: process.env.ARCHITECT_WHATSAPP }),
      });
    }
    ws.trial.reminderSent3Day = true;
    await ws.save();
    sent3 += 1;
  }

  // Expiring in ~1 day
  const oneDayList = await Workspace.find({
    'trial.enabled': true,
    'trial.reminderSent1Day': false,
    'trial.expiresAt': { $gt: now, $lte: new Date(now.getTime() + 1 * DAY) },
  });
  for (const ws of oneDayList) {
    const email = await adminEmail(ws);
    if (email) {
      await sendEmail({
        to: email,
        ...trial1Day({ brand: ws.brand, expiresAt: ws.trial.expiresAt, whatsapp: process.env.ARCHITECT_WHATSAPP }),
      });
    }
    ws.trial.reminderSent1Day = true;
    await ws.save();
    sent1 += 1;
  }

  // Already expired, not yet emailed
  const expiredList = await Workspace.find({
    'trial.enabled': true,
    'trial.expiredEmailSent': false,
    'trial.expiresAt': { $lt: now },
  });
  for (const ws of expiredList) {
    const email = await adminEmail(ws);
    if (email) {
      await sendEmail({
        to: email,
        ...trialExpired({ brand: ws.brand, whatsapp: process.env.ARCHITECT_WHATSAPP }),
      });
    }
    ws.trial.expiredEmailSent = true;
    ws.status = 'trial_expired';
    await ws.save();
    expired += 1;
  }

  logger.info('Trial reminders job complete', { sent3, sent1, expired });
  return { sent3, sent1, expired };
}

function scheduleTrialReminders() {
  // 09:00 IST = 03:30 UTC
  cron.schedule('30 3 * * *', () => {
    runTrialReminders().catch((err) => logger.error('Trial reminders failed', { error: err.message }));
  });
  logger.info('Scheduled trial reminders cron (03:30 UTC / 09:00 IST)');
}

module.exports = { scheduleTrialReminders, runTrialReminders };
