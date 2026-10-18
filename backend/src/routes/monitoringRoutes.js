const express = require('express');
const router = express.Router();
const {
  getDashboardKPIs,
  ingestSensorReading,
  getSimulatorStatus,
  toggleSimulator,
  triggerSimulationStep,
} = require('../controllers/monitoringController');
const { protect, verifySensorKey } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

// Hardware IoT Sensor ingestion: supports either sensor API key or user JWT
router.post('/sensor-reading', (req, res, next) => {
  if (req.headers['x-api-key'] || req.query.api_key) {
    return verifySensorKey(req, res, next);
  }
  return protect(req, res, next);
}, ingestSensorReading);

// Dashboard KPIs
router.get('/kpis', protect, getDashboardKPIs);

// Simulator controls
router.get('/simulator/status', protect, getSimulatorStatus);
router.post('/simulator/toggle', protect, authorize('admin'), toggleSimulator);
router.post('/simulator/step', protect, authorize('admin'), triggerSimulationStep);

module.exports = router;
