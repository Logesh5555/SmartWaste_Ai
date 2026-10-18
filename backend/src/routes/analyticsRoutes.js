const express = require('express');
const router = express.Router();
const { getAnalyticsSummary, exportCSV } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getAnalyticsSummary);
router.get('/export-csv', exportCSV);

module.exports = router;
