const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/email');
const { taskReminder } = require('../utils/emailTemplates');

async function runTaskReminders() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  const tasks = await Task.find({
    status: 'Pending',
    emailReminderSent: false,
    dueDate: { $gte: start, $lte: end },
  })
    .populate('assignedAgentId', 'name email')
    .populate('leadId', 'name')
    .lean();

  let sent = 0;
  const brandCache = new Map();

  for (const task of tasks) {
    if (!task.assignedAgentId?.email) {
      await Task.updateOne({ _id: task._id }, { emailReminderSent: true });
      continue;
    }
    let brand = brandCache.get(String(task.workspaceId));
    if (!brand) {
      const ws = await Workspace.findById(task.workspaceId).select('brand').lean();
      brand = ws?.brand || { name: 'EstateCore' };
      brandCache.set(String(task.workspaceId), brand);
    }
    await sendEmail({
      to: task.assignedAgentId.email,
      ...taskReminder({
        brand,
        task,
        leadName: task.leadId?.name,
        crmUrl: `${process.env.FRONTEND_URL}/tasks`,
      }),
    });
    await Task.updateOne({ _id: task._id }, { emailReminderSent: true });
    sent += 1;
  }

  logger.info('Task reminders job complete', { candidates: tasks.length, sent });
  return { candidates: tasks.length, sent };
}

function scheduleTaskReminders() {
  // 08:00 IST = 02:30 UTC
  cron.schedule('30 2 * * *', () => {
    runTaskReminders().catch((err) => logger.error('Task reminders failed', { error: err.message }));
  });
  logger.info('Scheduled task reminders cron (02:30 UTC / 08:00 IST)');
}

module.exports = { scheduleTaskReminders, runTaskReminders };
