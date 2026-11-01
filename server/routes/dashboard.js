const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

router.get('/stats', authMiddleware, getStats);

module.exports = router;
