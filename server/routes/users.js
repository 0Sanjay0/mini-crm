const router = require('express').Router();
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// GET /api/users  -> for assignee dropdowns
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const users = await User.find().select('name email role').sort('name');
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
