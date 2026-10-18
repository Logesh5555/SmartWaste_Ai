const express = require('express');
const router = express.Router();
const { getAlerts, resolveAlert, getAlertSummary } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAlerts);
router.get('/summary', getAlertSummary);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
