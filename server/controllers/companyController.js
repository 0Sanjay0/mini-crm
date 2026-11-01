const Company = require('../models/Company');
const Lead = require('../models/Lead');
const {
  isValidId, escapeRegex, parsePagination, pageMeta, pick, asyncHandler,
} = require('../utils/helpers');

const FIELDS = ['name', 'industry', 'website', 'email', 'phone', 'address'];

exports.createCompany = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  data.createdBy = req.user._id;
  const company = await Company.create(data);
  res.status(201).json(company);
});

exports.getCompanies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.search) {
    filter.name = new RegExp(escapeRegex(req.query.search.trim()), 'i');
  }

  const [data, total] = await Promise.all([
    Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Company.countDocuments(filter),
  ]);

  res.json({ data, pagination: pageMeta(total, page, limit) });
});

exports.getCompany = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });

  const company = await Company.findById(req.params.id);
  if (!company) return res.status(404).json({ message: 'Company not found' });

  // Leads follow the same visibility rule as /leads: admin all, user assigned only.
  const leadFilter = { company: company._id, isDeleted: false };
  if (req.user.role !== 'admin') leadFilter.assignedTo = req.user._id;

  const leads = await Lead.find(leadFilter)
    .populate({ path: 'assignedTo', select: 'name email' })
    .sort({ createdAt: -1 });

  res.json({ ...company.toObject(), leads });
});
