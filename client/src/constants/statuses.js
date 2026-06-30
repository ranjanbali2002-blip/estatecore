export const LEAD_STATUSES = ['New', 'Contacted', 'Site Visit', 'Negotiation', 'Won', 'Lost'];
export const LEAD_SOURCES = ['Website', 'Referral', 'Instagram', 'Facebook', 'Walk-in', 'Other'];
export const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot', 'Commercial', 'Office'];
export const PROPERTY_STATUSES = ['Available', 'Under Negotiation', 'Sold'];
export const DEAL_STAGES = ['Prospect', 'Proposal', 'Negotiation', 'Legal', 'Closed Won', 'Closed Lost'];
export const TASK_PRIORITIES = ['High', 'Medium', 'Low'];
export const TASK_STATUSES = ['Pending', 'Completed'];
export const CALL_OUTCOMES = ['Interested', 'Not Interested', 'Call Back', 'No Answer', 'Voicemail'];

// Badge color variants keyed by value
export const STATUS_COLORS = {
  // lead status
  New: 'blue',
  Contacted: 'amber',
  'Site Visit': 'purple',
  Negotiation: 'amber',
  Won: 'green',
  Lost: 'red',
  // property status
  Available: 'green',
  'Under Negotiation': 'amber',
  Sold: 'red',
  // deal stage
  Prospect: 'blue',
  Proposal: 'purple',
  Legal: 'amber',
  'Closed Won': 'green',
  'Closed Lost': 'red',
  // task priority
  High: 'red',
  Medium: 'amber',
  Low: 'green',
  // task status
  Pending: 'amber',
  Completed: 'green',
};
