const Lead = require('../models/Lead');
const { LEAD_STATUSES } = require('../utils/constants');
const {
  isValidId, escapeRegex, parsePagination, pageMeta, pick, asyncHandler,
} = require('../utils/helpers');

const isAdmin = (user) => user.role === 'admin';
// Admin sees everything; a normal user only sees leads assigned to them.
const scopeFor = (user) => (isAdmin(user) ? {} : { assignedTo: user._id });
const baseFilter = (user) => ({ isDeleted: false, ...scopeFor(user) });

const POPULATE = [
  { path: 'company', select: 'name' },
  { path: 'assignedTo', select: 'name email' },
];

const CREATE_FIELDS = ['name', 'email', 'phone', 'company', 'status', 'notes'];

exports.createLead = asyncHandler(async (req, res) => {
  const data = pick(req.body, CREATE_FIELDS);
  data.createdBy = req.user._id;
  // Only admins may assign to someone else; users always own what they create.
  data.assignedTo = isAdmin(req.user) && req.body.assignedTo ? req.body.assignedTo : req.user._id;
  if (data.status && !LEAD_STATUSES.includes(data.status)) {
    return res.status(400).json({ message: `status must be one of: ${LEAD_STATUSES.join(', ')}` });
  }
  const lead = await Lead.create(data);
  res.status(201).json(lead);
});

exports.getLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = baseFilter(req.user);

  if (req.query.status) {
    if (!LEAD_STATUSES.includes(req.query.status)) {
      return res.status(400).json({ message: `status must be one of: ${LEAD_STATUSES.join(', ')}` });
    }
    filter.status = req.query.status;
  }

  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [data, total] = await Promise.all([
    Lead.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json({ data, pagination: pageMeta(total, page, limit) });
});

exports.getLead = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const lead = await Lead.findOne({ _id: req.params.id, ...baseFilter(req.user) }).populate(POPULATE);
  if (!lead) return res.status(404).json({ message: 'Lead not found' });
  res.json(lead);
});

exports.updateLead = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const lead = await Lead.findOne({ _id: req.params.id, ...baseFilter(req.user) });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  const updates = pick(req.body, CREATE_FIELDS);
  if (isAdmin(req.user) && req.body.assignedTo) updates.assignedTo = req.body.assignedTo;
  if (updates.status && !LEAD_STATUSES.includes(updates.status)) {
    return res.status(400).json({ message: `status must be one of: ${LEAD_STATUSES.join(', ')}` });
  }

  lead.set(updates);
  await lead.save();
  res.json(lead);
});

exports.updateLeadStatus = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const { status } = req.body;
  if (!LEAD_STATUSES.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${LEAD_STATUSES.join(', ')}` });
  }
  const lead = await Lead.findOne({ _id: req.params.id, ...baseFilter(req.user) });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  lead.status = status;
  await lead.save();
  res.json(lead);
});

exports.deleteLead = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const lead = await Lead.findOne({ _id: req.params.id, ...baseFilter(req.user) });
  if (!lead) return res.status(404).json({ message: 'Lead not found' });

  lead.isDeleted = true;
  lead.deletedAt = new Date();
  await lead.save();
  res.json({ message: 'Lead deleted' });
});
