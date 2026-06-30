# EstateCore — Deployment Guide

Stack: **MongoDB Atlas** (database) · **Render** (backend API) · **Vercel** (frontend).
All three have free tiers. Total time ~30 min.

> The frontend and backend live on different domains in production, so the app
> uses `SameSite=None; Secure` cookies (already configured for `NODE_ENV=production`).
> This requires both to be served over HTTPS — Render and Vercel both do this automatically.

---

## Step 0 — Push the code to GitHub

Both Render and Vercel deploy from a Git repo.

```bash
cd D:\projects\crm1
git init
git add .
git commit -m "EstateCore initial"
git branch -M main
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/estatecore.git
git push -u origin main
```

`.gitignore` already excludes `.env` and `node_modules`, so your secrets are NOT pushed. Good.

---

## Step 1 — MongoDB Atlas (database)

1. Sign up at https://www.mongodb.com/cloud/atlas → **Create** a free **M0** cluster.
2. **Database Access** → Add New Database User → username + password (save these).
3. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`).
   Render's free tier uses dynamic IPs, so this is required.
4. **Database → Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Insert your password and add the database name `estatecore` before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/estatecore?retryWrites=true&w=majority
   ```
   Keep this as your `MONGODB_URI`.

---

## Step 2 — Render (backend API)

1. Sign up at https://render.com → **New → Web Service** → connect your GitHub repo.
2. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
3. **Environment Variables** — add every one below (Render injects `PORT` itself,
   so **do not** add PORT). Generate the three secrets with:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://PLACEHOLDER.vercel.app` (update in Step 4) |
   | `MONGODB_URI` | your Atlas string from Step 1 |
   | `ACCESS_TOKEN_SECRET` | random 96-char hex |
   | `REFRESH_TOKEN_SECRET` | random 96-char hex |
   | `ARCHITECT_TOKEN_SECRET` | random 96-char hex |
   | `ACCESS_TOKEN_EXPIRY` | `15m` |
   | `REFRESH_TOKEN_EXPIRY` | `30d` |
   | `ARCHITECT_EMAIL` | your login email |
   | `ARCHITECT_PASSWORD` | a strong password (8+ chars, upper/lower/number) |
   | `ARCHITECT_WHATSAPP` | your WhatsApp number, digits only e.g. `9198…` |
   | `PAYMENTS_ENABLED` | `false` |
   | `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary |
   | `CLOUDINARY_API_SECRET` | from Cloudinary |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | your Gmail address |
   | `SMTP_PASS` | Gmail **App Password** (not your login password) |
   | `EMAIL_FROM` | `EstateCore <youraddress@gmail.com>` |

   > The server validates all of these on boot and **refuses to start** if any are
   > missing/blank. Cloudinary + SMTP must be real values (placeholders fail boot
   > only if empty — non-empty placeholders boot, but uploads/emails won't work).
4. **Create Web Service.** When the log shows `EstateCore API listening on port …`,
   copy your API URL, e.g. `https://estatecore-api.onrender.com`.
5. Quick check: open `https://estatecore-api.onrender.com/api/health` → should return JSON.

### Gmail App Password (for emails)
Google Account → **Security** → 2-Step Verification (must be on) →
**App passwords** → generate one → use it as `SMTP_PASS`.

### Cloudinary (for logo uploads)
Sign up at https://cloudinary.com → Dashboard shows Cloud name, API Key, API Secret.

---

## Step 3 — Vercel (frontend)

1. Sign up at https://vercel.com → **Add New → Project** → import your repo.
2. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detected)
   - Build command & output dir are auto (`npm run build` → `dist`).
3. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | your Render base URL, e.g. `https://estatecore-api.onrender.com` (NO trailing slash, NO `/api`) |
   | `VITE_WHATSAPP` | your WhatsApp number, digits only |
4. **Deploy.** Copy your live URL, e.g. `https://estatecore.vercel.app`.

`client/vercel.json` already rewrites all routes to `index.html` so deep links and
the `/portal/:token` route work.

---

## Step 4 — Connect the two (important)

1. Back in **Render → your service → Environment**, set
   `FRONTEND_URL` to your real Vercel URL, e.g. `https://estatecore.vercel.app`
   (exact, no trailing slash — this is the CORS allow-list).
2. Render auto-redeploys. Once live, open your Vercel URL and log in with your
   `ARCHITECT_EMAIL` / `ARCHITECT_PASSWORD`.
3. Go to **Workspaces → Create Trial Workspace** to onboard your first client.

---

## Notes & gotchas

- **Render free tier sleeps** after ~15 min of inactivity; the first request after
  that has a ~50s cold start. Also, the **cron jobs** (trial/task reminders) won't
  fire while the service is asleep. For reliable crons either upgrade to a paid
  instance, or set a free pinger (e.g. cron-job.org) to hit `/api/health` every
  10 min to keep it warm.
- **CORS / cookie errors after deploy** almost always mean `FRONTEND_URL` on Render
  doesn't exactly match your Vercel URL (trailing slash, http vs https, or the
  placeholder was never updated). Fix it and redeploy.
- **Custom domain:** add it in Vercel, then update `FRONTEND_URL` on Render to match.
- **Going paid (Phase 3):** set `PAYMENTS_ENABLED=true` and fill the `RAZORPAY_*`
  vars on Render, then point your Razorpay webhook to
  `https://<your-render-url>/api/billing/webhook`. No code changes needed.
```
