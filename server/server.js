require('dotenv').config();

const path = require('path');
// Load .env from project root if not found in /server
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const validateEnv = require('./utils/envValidator');
validateEnv();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const bootstrapArchitect = require('./utils/bootstrapArchitect');
const { scheduleTrialReminders } = require('./jobs/trialReminders');
const { scheduleTaskReminders } = require('./jobs/taskReminders');

// Controllers/routes
const billingController = require('./controllers/billingController');
const authRoutes = require('./routes/auth');
const architectRoutes = require('./routes/architect');
const workspaceRoutes = require('./routes/workspace');
const agentRoutes = require('./routes/agents');
const leadRoutes = require('./routes/leads');
const dealRoutes = require('./routes/deals');
const propertyRoutes = require('./routes/properties');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const billingRoutes = require('./routes/billing');
const portalRoutes = require('./routes/portal');

const app = express();
app.set('trust proxy', 1);

// ---- Security & global middleware ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Razorpay webhook needs the RAW body for signature verification — mount BEFORE json
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingController.webhook);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
  },
});
app.use('/api', globalLimiter);
app.use(requestLogger);

// ---- Health ----
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
      time: new Date().toISOString(),
    },
  });
});

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/architect', architectRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/portal', portalRoutes);

// ---- 404 + error handler ----
app.use(notFoundHandler);
app.use(errorHandler);

// ---- Startup ----
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected');

    await bootstrapArchitect();

    scheduleTrialReminders();
    scheduleTaskReminders();

    app.listen(PORT, () => {
      logger.info(`EstateCore API listening on port ${PORT}`, {
        env: process.env.NODE_ENV,
        paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
      });
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

start();

module.exports = app;
