/**
 * Dark HTML email templates. All take a `brand` object
 * { name, logoUrl, accentColor, supportEmail } and template-specific data.
 * Returns { subject, html }.
 */

const DEFAULT_ACCENT = '#C9A84C';

function baseLayout({ brand = {}, heading, bodyHtml }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const logo = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.name || 'EstateCore'}" style="max-height:48px;" />`
    : `<span style="font-family:Georgia,serif;font-size:24px;color:${accent};font-weight:bold;">${
        brand.name || 'EstateCore'
      }</span>`;
  const support = brand.supportEmail || 'support@estatecore.app';

  return `
  <body style="margin:0;padding:0;background:#0B0F1A;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B0F1A;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A2035;border-radius:14px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
          <tr><td style="padding:28px 32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
            ${logo}
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;color:#ffffff;">${heading}</h1>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#c7cdda;">
              ${bodyHtml}
            </div>
          </td></tr>
          <tr><td style="padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);font-family:Arial,sans-serif;font-size:12px;color:#6b7280;">
            Need help? Contact <a href="mailto:${support}" style="color:${accent};text-decoration:none;">${support}</a><br/>
            <span style="opacity:.7;">Powered by EstateCore</span>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>`;
}

function button(label, url, accent = DEFAULT_ACCENT) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:10px;background:${accent};">
    <a href="${url}" style="display:inline-block;padding:13px 26px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;color:#0B0F1A;text-decoration:none;border-radius:10px;">${label}</a>
  </td></tr></table>`;
}

function whatsappLink(phone, text) {
  return `https://wa.me/${String(phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// 1. Trial Welcome
function trialWelcome({ brand, loginUrl, email, password, expiresAt, whatsapp }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const wa = whatsappLink(whatsapp, `Hi, I just started my ${brand.name} CRM trial and have a question.`);
  const body = `
    <p>Your ${brand.name} CRM workspace is ready. Here are your login details:</p>
    <div style="background:#0B0F1A;border-radius:10px;padding:16px;margin:16px 0;border:1px solid rgba(255,255,255,0.06);">
      <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin:4px 0;"><strong>Password:</strong> ${password}</p>
    </div>
    <p><strong>Quick start:</strong></p>
    <ul style="padding-left:18px;">
      <li>Add your first leads and assign them to agents</li>
      <li>Move deals through your visual pipeline</li>
      <li>White-label the CRM under Brand Settings</li>
    </ul>
    <p>Your trial ends on <strong>${fmtDate(expiresAt)}</strong>.</p>
    ${button('Log in to your CRM', loginUrl, accent)}
    <p style="font-size:13px;">Questions? <a href="${wa}" style="color:${accent};">Chat with us on WhatsApp</a>.</p>`;
  return {
    subject: `Welcome to ${brand.name} CRM — Your trial is ready`,
    html: baseLayout({ brand, heading: `Welcome to ${brand.name} CRM`, bodyHtml: body }),
  };
}

// 2. New Agent Welcome
function agentWelcome({ brand, loginUrl, email, password, addedBy }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const body = `
    <p>${addedBy} has added you to the ${brand.name} CRM. Use the details below to sign in:</p>
    <div style="background:#0B0F1A;border-radius:10px;padding:16px;margin:16px 0;border:1px solid rgba(255,255,255,0.06);">
      <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin:4px 0;"><strong>Password:</strong> ${password}</p>
    </div>
    ${button('Log in', loginUrl, accent)}
    <p style="font-size:13px;">Please change your password after your first login.</p>`;
  return {
    subject: `You've been added to ${brand.name} CRM`,
    html: baseLayout({ brand, heading: `You're in, welcome!`, bodyHtml: body }),
  };
}

// 3. Trial 3-day warning
function trial3Day({ brand, expiresAt, whatsapp }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const wa = whatsappLink(whatsapp, `Hi, I'd like to subscribe to ${brand.name} CRM before my trial ends.`);
  const body = `
    <p>Your ${brand.name} trial ends on <strong>${fmtDate(expiresAt)}</strong> — that's just 3 days away.</p>
    <p>To keep your leads, deals, pipeline and analytics, subscribe before then.</p>
    ${button('Talk to us on WhatsApp', wa, accent)}`;
  return {
    subject: `Your ${brand.name} trial ends in 3 days`,
    html: baseLayout({ brand, heading: 'Your trial is ending soon', bodyHtml: body }),
  };
}

// 4. Trial 1-day warning
function trial1Day({ brand, expiresAt, whatsapp }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const wa = whatsappLink(whatsapp, `Hi, my ${brand.name} CRM trial ends tomorrow — I want to continue.`);
  const body = `
    <p><strong>Tomorrow is the last day</strong> of your ${brand.name} trial (${fmtDate(expiresAt)}).</p>
    <p>Don't lose access to your workspace — let's get you set up to continue.</p>
    ${button('Subscribe via WhatsApp', wa, accent)}`;
  return {
    subject: `Last day of your ${brand.name} trial tomorrow`,
    html: baseLayout({ brand, heading: 'Last day tomorrow', bodyHtml: body }),
  };
}

// 5. Trial expired
function trialExpired({ brand, whatsapp }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const wa = whatsappLink(whatsapp, `Hi, my ${brand.name} CRM trial has ended. I'd like to subscribe and continue.`);
  const body = `
    <p>Thank you for trying ${brand.name} CRM. Your free trial has now ended.</p>
    <p>Your data is safe. Contact us to reactivate your workspace and pick up where you left off.</p>
    ${button('Reactivate via WhatsApp', wa, accent)}`;
  return {
    subject: `Your ${brand.name} trial has ended`,
    html: baseLayout({ brand, heading: 'Your trial has ended', bodyHtml: body }),
  };
}

// 6. Trial extended
function trialExtended({ brand, expiresAt, days, loginUrl }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const body = `
    <p>Good news — your ${brand.name} CRM trial has been extended by <strong>${days} days</strong>.</p>
    <p>Your new trial end date is <strong>${fmtDate(expiresAt)}</strong>.</p>
    ${button('Back to your CRM', loginUrl, accent)}`;
  return {
    subject: 'Good news — your trial has been extended',
    html: baseLayout({ brand, heading: 'Trial extended', bodyHtml: body }),
  };
}

// 7. Task reminder
function taskReminder({ brand, task, leadName, crmUrl }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const body = `
    <p>This is a reminder that the following task is due today:</p>
    <div style="background:#0B0F1A;border-radius:10px;padding:16px;margin:16px 0;border:1px solid rgba(255,255,255,0.06);">
      <p style="margin:4px 0;"><strong>${task.title}</strong></p>
      ${leadName ? `<p style="margin:4px 0;">Lead: ${leadName}</p>` : ''}
      <p style="margin:4px 0;">Priority: ${task.priority}</p>
      <p style="margin:4px 0;">Due: ${fmtDate(task.dueDate)}</p>
    </div>
    ${button('Open in CRM', crmUrl, accent)}`;
  return {
    subject: `Reminder: ${task.title} is due today`,
    html: baseLayout({ brand, heading: 'Task due today', bodyHtml: body }),
  };
}

// 8. Payment failed (Phase 3)
function paymentFailed({ brand, retryUrl }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const body = `
    <p>We were unable to process the payment for your ${brand.name} CRM subscription.</p>
    <p>Your workspace is now inactive. Please update your payment method to restore access.</p>
    ${button('Retry payment', retryUrl, accent)}`;
  return {
    subject: `Action Required — Payment failed for ${brand.name} CRM`,
    html: baseLayout({ brand, heading: 'Payment failed', bodyHtml: body }),
  };
}

// 9. Subscription cancelled (Phase 3)
function subscriptionCancelled({ brand, periodEnd, resubscribeUrl }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const body = `
    <p>Your ${brand.name} CRM subscription has been cancelled.</p>
    <p>You'll retain access until <strong>${fmtDate(periodEnd)}</strong>. You can resubscribe anytime.</p>
    ${button('Resubscribe', resubscribeUrl, accent)}`;
  return {
    subject: `Your ${brand.name} subscription has been cancelled`,
    html: baseLayout({ brand, heading: 'Subscription cancelled', bodyHtml: body }),
  };
}

// 10. Trial request received (to applicant, self-registration)
function trialRequestReceived({ brand, name }) {
  const body = `
    <p>Hi ${name},</p>
    <p>Thanks for registering for a free ${brand.name} CRM trial. Your request has been received and is
    <strong>pending approval</strong>.</p>
    <p>You'll get another email the moment it's approved — then you can log in with the email and password
    you just chose.</p>`;
  return {
    subject: `We received your ${brand.name} CRM trial request`,
    html: baseLayout({ brand, heading: 'Trial request received', bodyHtml: body }),
  };
}

// 11. New trial request (to architect)
function newTrialRequestArchitect({ brandName, name, email, phone, panelUrl }) {
  const brand = { name: 'EstateCore', accentColor: DEFAULT_ACCENT };
  const body = `
    <p>A new trial request just came in:</p>
    <div style="background:#0B0F1A;border-radius:10px;padding:16px;margin:16px 0;border:1px solid rgba(255,255,255,0.06);">
      <p style="margin:4px 0;"><strong>Brand:</strong> ${brandName}</p>
      <p style="margin:4px 0;"><strong>Name:</strong> ${name}</p>
      <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin:4px 0;"><strong>Phone:</strong> ${phone || '—'}</p>
    </div>
    ${button('Review in Architect panel', panelUrl)}`;
  return {
    subject: `New trial request — ${brandName}`,
    html: baseLayout({ brand, heading: 'New trial request', bodyHtml: body }),
  };
}

// 12. Trial approved (to self-registered applicant — no password, they set their own)
function trialApprovedSelf({ brand, loginUrl, expiresAt, whatsapp }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const wa = whatsappLink(whatsapp, `Hi, I have a question about my ${brand.name} CRM trial.`);
  const body = `
    <p>Great news — your ${brand.name} CRM trial has been <strong>approved</strong>! 🎉</p>
    <p>Log in with the email and password you registered with. Your trial runs until
    <strong>${fmtDate(expiresAt)}</strong>.</p>
    ${button('Log in to your CRM', loginUrl, accent)}
    <p style="font-size:13px;">Questions? <a href="${wa}" style="color:${accent};">Chat with us on WhatsApp</a>.</p>`;
  return {
    subject: `Your ${brand.name} CRM trial is approved`,
    html: baseLayout({ brand, heading: 'Your trial is approved', bodyHtml: body }),
  };
}

// 13. Trial request rejected
function trialRejected({ brand, whatsapp }) {
  const accent = brand.accentColor || DEFAULT_ACCENT;
  const wa = whatsappLink(whatsapp, `Hi, I'd like to follow up on my ${brand.name} CRM trial request.`);
  const body = `
    <p>Thank you for your interest in ${brand.name} CRM.</p>
    <p>We're unable to activate your trial automatically at this time. If you think this is a mistake or
    would like to discuss, please reach out.</p>
    ${button('Contact us on WhatsApp', wa, accent)}`;
  return {
    subject: `About your ${brand.name} CRM trial request`,
    html: baseLayout({ brand, heading: 'Trial request update', bodyHtml: body }),
  };
}

module.exports = {
  trialWelcome,
  agentWelcome,
  trial3Day,
  trial1Day,
  trialExpired,
  trialExtended,
  taskReminder,
  paymentFailed,
  subscriptionCancelled,
  trialRequestReceived,
  newTrialRequestArchitect,
  trialApprovedSelf,
  trialRejected,
};
