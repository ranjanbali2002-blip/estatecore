/* eslint-disable no-console */
require('dotenv').config();
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const RefreshToken = require('../models/RefreshToken');
const BillingEvent = require('../models/BillingEvent');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Property = require('../models/Property');
const Task = require('../models/Task');
const { getAgentLimit } = require('./plans');

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run seed in production.');
  process.exit(1);
}

const DAY = 24 * 60 * 60 * 1000;
const PASSWORD = 'Password123';

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kabir', 'Ishaan', 'Rohan', 'Priya', 'Neha', 'Karan', 'Sneha', 'Riya', 'Aryan', 'Meera'];
const LAST = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Gupta', 'Mehta', 'Singh', 'Khan', 'Joshi', 'Rao', 'Desai', 'Kapoor', 'Malhotra'];
const LOCATIONS = ['Bandra, Mumbai', 'Andheri, Mumbai', 'Whitefield, Bangalore', 'Koramangala, Bangalore', 'Gurgaon, Delhi NCR', 'Dwarka, Delhi', 'Powai, Mumbai', 'HSR Layout, Bangalore', 'Noida Sector 62', 'Hinjewadi, Pune'];
const TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'];
const SOURCES = ['Website', 'Referral', 'Instagram', 'Facebook', 'Walk-in', 'Other'];
const LEAD_STATUSES = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Won', 'Lost'];
const DEAL_STAGES = ['Prospect', 'Proposal', 'Negotiation', 'Legal', 'Closed Won', 'Closed Lost'];
const PRIORITIES = ['High', 'Medium', 'Low'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const name = () => `${rand(FIRST)} ${rand(LAST)}`;
const phone = () => `+91${randInt(70000, 99999)}${randInt(10000, 99999)}`;
const emailFrom = (n, i) => `${n.toLowerCase().replace(/\s+/g, '.')}.${i}@example.com`;
const daysAgo = (d) => new Date(Date.now() - d * DAY);
const daysAhead = (d) => new Date(Date.now() + d * DAY);
const budget = () => randInt(15, 500) * 100000; // 15L - 5Cr

async function createWorkspace({ brandName, accent, trialPlan, trialDays, agentCount, leadCount, dealCount, propCount, taskCount, portalCount }) {
  const adminUser = await User.create({
    role: 'admin',
    name: `${brandName} Admin`,
    email: `admin@${brandName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    password: PASSWORD,
    isActive: true,
  });

  const ws = await Workspace.create({
    adminId: adminUser._id,
    plan: trialPlan,
    agentLimit: getAgentLimit(trialPlan),
    status: 'active',
    trial: { enabled: true, plan: trialPlan, expiresAt: daysAhead(trialDays), createdByArchitect: true },
    brand: { name: brandName, accentColor: accent, supportEmail: `support@${brandName.toLowerCase().replace(/[^a-z]/g, '')}.com` },
  });
  adminUser.workspaceId = ws._id;
  await adminUser.save();

  // Agents
  const agents = [];
  for (let i = 0; i < agentCount; i += 1) {
    const n = name();
    const a = await User.create({
      role: 'agent',
      workspaceId: ws._id,
      name: n,
      email: emailFrom(n, `${i}.${brandName.replace(/[^a-z]/gi, '').toLowerCase()}`),
      password: PASSWORD,
      isActive: true,
    });
    agents.push(a);
  }
  const owners = [adminUser, ...agents];

  // Properties
  const properties = [];
  for (let i = 0; i < propCount; i += 1) {
    const type = rand(TYPES);
    const p = await Property.create({
      workspaceId: ws._id,
      title: `${randInt(1, 4)} BHK ${type} in ${rand(LOCATIONS).split(',')[0]}`,
      type,
      location: rand(LOCATIONS),
      price: budget(),
      bhk: type === 'Plot' || type === 'Commercial' || type === 'Office' ? 0 : randInt(1, 5),
      areaSqft: randInt(450, 5000),
      status: rand(['Available', 'Available', 'Under Negotiation', 'Sold']),
      description: 'Prime location, ready to move, excellent connectivity and amenities.',
      imageUrls: [],
      createdBy: adminUser._id,
    });
    properties.push(p);
  }

  // Leads
  const leads = [];
  for (let i = 0; i < leadCount; i += 1) {
    const n = name();
    const owner = rand(owners);
    const l = await Lead.create({
      workspaceId: ws._id,
      assignedAgentId: owner._id,
      name: n,
      phone: phone(),
      email: emailFrom(n, i),
      budget: budget(),
      propertyType: rand(TYPES),
      locationInterest: rand(LOCATIONS),
      source: rand(SOURCES),
      status: rand(LEAD_STATUSES),
      notes: [{ text: 'Initial enquiry captured. Following up.', createdBy: owner._id, createdAt: daysAgo(randInt(1, 60)) }],
      callLog: Math.random() > 0.5 ? [{ outcome: rand(['Interested', 'Call Back', 'No Answer']), duration: randInt(1, 15), notes: 'Discussed requirements.', loggedBy: owner._id, loggedAt: daysAgo(randInt(1, 30)) }] : [],
      createdBy: owner._id,
      createdAt: daysAgo(randInt(1, 90)),
    });
    leads.push(l);
  }

  // Deals
  for (let i = 0; i < dealCount; i += 1) {
    const owner = rand(agents.length ? agents : owners);
    const lead = rand(leads);
    const property = rand(properties);
    const value = budget();
    const stage = rand(DEAL_STAGES);
    const portal = i < portalCount;
    await Deal.create({
      workspaceId: ws._id,
      assignedAgentId: owner._id,
      leadId: lead._id,
      propertyId: property._id,
      title: `${lead.name} — ${property.title}`,
      value,
      commission: Math.round(value * 0.02),
      stage,
      expectedCloseDate: daysAhead(randInt(-10, 45)),
      notes: 'Active negotiation in progress.',
      clientPortalToken: portal ? crypto.randomBytes(24).toString('hex') : undefined,
      clientPortalEnabled: portal,
      createdBy: owner._id,
    });
  }

  // Tasks
  for (let i = 0; i < taskCount; i += 1) {
    const owner = rand(owners);
    const lead = rand(leads);
    const overdue = i % 4 === 0;
    await Task.create({
      workspaceId: ws._id,
      assignedAgentId: owner._id,
      leadId: lead._id,
      title: rand(['Call back lead', 'Schedule site visit', 'Send brochure', 'Follow up on offer', 'Prepare agreement']),
      dueDate: overdue ? daysAgo(randInt(1, 5)) : daysAhead(randInt(0, 14)),
      priority: rand(PRIORITIES),
      status: Math.random() > 0.7 ? 'Completed' : 'Pending',
      notes: 'Auto-generated seed task.',
      completedAt: Math.random() > 0.7 ? daysAgo(randInt(1, 10)) : undefined,
      createdBy: adminUser._id,
    });
  }

  console.log(`  ✓ ${brandName}: admin=${adminUser.email}, ${agentCount} agents, ${leadCount} leads, ${dealCount} deals, ${propCount} properties, ${taskCount} tasks`);
  return ws;
}

async function run() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing collections...');

  await Promise.all([
    User.deleteMany({}),
    Workspace.deleteMany({}),
    RefreshToken.deleteMany({}),
    BillingEvent.deleteMany({}),
    Lead.deleteMany({}),
    Deal.deleteMany({}),
    Property.deleteMany({}),
    Task.deleteMany({}),
  ]);

  // Architect
  await User.create({
    role: 'architect',
    name: 'Architect',
    email: process.env.ARCHITECT_EMAIL.toLowerCase(),
    password: process.env.ARCHITECT_PASSWORD,
    workspaceId: null,
    isActive: true,
  });
  console.log(`  ✓ Architect: ${process.env.ARCHITECT_EMAIL}`);

  await createWorkspace({
    brandName: 'Skyline Realty', accent: '#1E88E5', trialPlan: 'pro', trialDays: 14,
    agentCount: 3, leadCount: 25, dealCount: 8, propCount: 10, taskCount: 15, portalCount: 2,
  });
  await createWorkspace({
    brandName: 'GoldKey Properties', accent: '#E65100', trialPlan: 'enterprise', trialDays: 7,
    agentCount: 5, leadCount: 35, dealCount: 12, propCount: 15, taskCount: 20, portalCount: 5,
  });

  console.log('\nSeed complete. All passwords: ' + PASSWORD);
  console.log('Architect password: (your ARCHITECT_PASSWORD)\n');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
