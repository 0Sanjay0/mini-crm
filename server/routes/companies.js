const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const c = require('../controllers/companyController');

router.use(authMiddleware);

router.route('/').post(c.createCompany).get(c.getCompanies);
router.get('/:id', c.getCompany);

module.exports = router;
