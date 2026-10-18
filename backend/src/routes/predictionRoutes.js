const express = require('express');
const router = express.Router();
const {
  getBinPrediction,
  getAllPredictions,
  getModelMetrics,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/bin/:id', getBinPrediction);
router.get('/all', getAllPredictions);
router.get('/metrics', getModelMetrics);

module.exports = router;
