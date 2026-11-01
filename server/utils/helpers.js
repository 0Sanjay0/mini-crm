const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const pageMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit) || 1,
});

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

// Wraps async handlers and maps common Mongoose errors to HTTP responses.
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }
    if (err.name === 'CastError') {
      return res.status(400).json({ message: `Invalid ${err.path}` });
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Duplicate value', fields: err.keyValue });
    }
    next(err);
  }
};

module.exports = { isValidId, escapeRegex, parsePagination, pageMeta, pick, asyncHandler };
