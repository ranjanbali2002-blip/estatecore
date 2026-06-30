const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Sends an email. Never throws to the caller — logs failures so that
 * a flaky SMTP server can't break a request flow (e.g. creating a workspace).
 * Returns true/false for callers that care.
 */
async function sendEmail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info('Email sent', { to, subject, messageId: info.messageId });
    return true;
  } catch (err) {
    logger.error('Email send failed', { to, subject, error: err.message });
    return false;
  }
}

module.exports = { sendEmail, getTransporter };
