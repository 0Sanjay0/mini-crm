const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const c = require('../controllers/taskController');

router.use(authMiddleware);

router.route('/').post(c.createTask).get(c.getTasks);
router.patch('/:id/status', c.updateTaskStatus);

module.exports = router;
