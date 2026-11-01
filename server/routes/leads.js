const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const c = require('../controllers/leadController');

router.use(authMiddleware);

router.route('/').post(c.createLead).get(c.getLeads);
router.patch('/:id/status', c.updateLeadStatus);
router.route('/:id').get(c.getLead).put(c.updateLead).patch(c.updateLead).delete(c.deleteLead);

module.exports = router;
