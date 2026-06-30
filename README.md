# EstateCore — Multi-tenant White-label Real Estate CRM

Production-ready, business-ready full-stack CRM for Indian real estate agencies.
Multi-tenant, white-labeled, with an Architect (god-mode) panel, Admin workspaces,
and Agent scoping. **Phase 1** runs entirely on free tiers with a trial system in
place of live billing; Razorpay is built and gated behind `PAYMENTS_ENABLED`.

```
crm1/
├── server/      Node 20 + Express 4 + Mongoose 8 API
├── client/      React 18 + Vite + Tailwind + Recharts SPA
├── .env.example Backend env template
└── README.md
```

## Tech stack

- **Frontend:** React 18, Vite, TailwindCSS, Recharts, @hello-pangea/dnd, papaparse
- **Backend:** Node.js, Express 4, Mongoose 8
- **Auth:** JWT access (15m) + rotating refresh (30d, httpOnly cookie)
- **Payments:** Razorpay subscriptions (gated behind `PAYMENTS_ENABLED`)
- **Email:** Nodemailer (Gmail SMTP)
- **Storage:** Cloudinary (logo uploads)
- **Cron:** node-cron (trial + task reminders)
- **Security:** helmet, cors, express-rate-limit, express-mongo-sanitize, hpp, express-validator
- **Logging:** Winston (JSON, file + console)
- **Process:** PM2 (`ecosystem.config.js`)

## Roles

| Role | Created by | Scope |
|------|-----------|-------|
| **Architect** | `.env` (`ARCHITECT_EMAIL` / `ARCHITECT_PASSWORD`) | God mode across the whole platform |
| **Admin** | Architect (trial) or Razorpay webhook (paid) | Owns one isolated workspace |
| **Agent** | Admin | Scoped to their own leads/deals/tasks within the workspace |

---

## Local development

### 1. Prerequisites
- Node.js 18+ (20 recommended)
- A MongoDB connection string (MongoDB Atlas free tier is fine)
- Cloudinary account (free tier)
- A Gmail account with an **App Password** for SMTP

### 2. Backend

```bash
cd server
npm install
cp ../.env.example ../.env     # then fill in the values (see below)
npm run dev                    # nodemon, or: npm start
```

The server validates **all** required env vars on boot and exits with a clear
list if any are missing. On first boot it creates/syncs the Architect account
from your `.env`.

### 3. Seed demo data (optional, dev only)

```bash
cd server
npm run seed
```

Creates the Architect, plus two demo workspaces (**Skyline Realty** — Pro trial,
**GoldKey Properties** — Enterprise trial) with realistic Indian leads, deals,
properties and tasks. All seeded user passwords are `Password123`. The seed
**refuses to run** when `NODE_ENV=production`.

### 4. Frontend

```bash
cd client
npm install
cp .env.example .env           # set VITE_API_URL and VITE_WHATSAPP
npm run dev                    # http://localhost:5173
```

---

## Environment variables

Backend (`/.env`, template in `.env.example`):

| Group | Keys |
|-------|------|
| Server | `NODE_ENV`, `PORT`, `FRONTEND_URL` |
| Database | `MONGODB_URI` |
| Auth | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ARCHITECT_TOKEN_SECRET`, `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY` |
| Architect | `ARCHITECT_EMAIL`, `ARCHITECT_PASSWORD`, `ARCHITECT_WHATSAPP` |
| Payments | `PAYMENTS_ENABLED` (+ `RAZORPAY_*` when enabled) |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |

Frontend (`/client/.env`):

```
VITE_API_URL=http://localhost:5000
VITE_WHATSAPP=919999999999      # number used for all WhatsApp CTAs (digits only)
```

> Secrets: generate strong random values, e.g.
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

---

## Creating the first trial workspace

1. Log in at `/login` with your Architect credentials.
2. Go to **Workspaces → Create Trial Workspace**.
3. Fill admin name/email, brand name, trial plan and duration. Use auto-generate
   for the password.
4. On success, copy the credentials (also emailed to the admin) and share them.
   The admin can now log in and starts on their trial plan.

Trial reminders (3-day, 1-day, expired) are sent automatically by the daily cron.

---

## Flipping to paid mode (Phase 3)

1. Set `PAYMENTS_ENABLED=true` in `.env` and fill all `RAZORPAY_*` values
   (key id/secret, webhook secret, and the three plan ids).
2. Restart the server — env validation now **requires** the Razorpay vars.
3. Point your Razorpay webhook to `POST https://<api-host>/api/billing/webhook`
   (raw body; signature is verified with `RAZORPAY_WEBHOOK_SECRET`).
4. The billing routes (`create-subscription`, `cancel`, `upgrade`) and the
   frontend checkout activate automatically. Webhooks are idempotent via the
   `BillingEvent` collection. **No code changes required.**

To convert an existing trial workspace, use **Workspaces → Convert to Paid**.

---

## Deployment

### Backend → Railway (free tier)
- Root directory: `server`
- Start command: `npm start` (or PM2: `pm2 start ecosystem.config.js --env production`)
- Add all backend env vars in the Railway dashboard.
- Set `FRONTEND_URL` to your Vercel URL (CORS whitelist).

### Frontend → Vercel
- Root directory: `client`
- Build command: `npm run build`, output dir: `dist`
- `vercel.json` rewrites all routes to `index.html` (SPA).
- Set `VITE_API_URL` to your Railway API URL and `VITE_WHATSAPP`.

### Database → MongoDB Atlas (free 512MB)
- Whitelist your Railway egress IPs (or `0.0.0.0/0` for the free tier) and set
  `MONGODB_URI`.

### File storage → Cloudinary (free tier)
- Logos are uploaded to `estatecore/workspaces/{workspaceId}/logo`; the previous
  logo is deleted before each new upload.

---

## Security highlights

- Bcrypt (12 rounds), password strength enforced, account lock after 10 failed
  attempts (1h), login rate-limited (5 / 15m / IP), global rate-limit (100 / 15m).
- Refresh tokens stored **hashed**, rotated on every refresh, httpOnly + secure +
  sameSite=strict cookie.
- Workspace isolation enforced in middleware (`enforceWorkspace`), not controllers.
- Razorpay webhook signature verified before processing; idempotent.
- helmet, mongo-sanitize, hpp, 10kb JSON limit, ObjectId validation on every id param.
- Winston JSON logs (`server/logs/error.log`, `combined.log`); never logs secrets.

## Cron jobs (IST)

- **08:00** task reminders — emails agents about tasks due today.
- **09:00** trial reminders — 3-day, 1-day, and expired notifications; flips
  expired workspaces to `trial_expired`.
