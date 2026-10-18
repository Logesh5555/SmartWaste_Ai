const { binRepo, taskRepo, alertRepo, fillLogRepo } = require('../models/dataRepository');
const { emitBinUpdate, emitAlert } = require('../services/socketService');
const {
  startSimulator,
  stopSimulator,
  getSimulatorState,
  runSimulationStep,
} = require('../services/simulatorService');
const { getPredictionForBin } = require('../services/mlClientService');

const getDashboardKPIs = async (req, res, next) => {
  try {
    const bins = await binRepo.find({});
    const tasks = await taskRepo.find({});
    const alerts = await alertRepo.find({ resolved: false });

    const totalBins = bins.length;
    let normalBins = 0;
    let warningBins = 0;
    let criticalBins = 0;
    let totalFill = 0;
    let predictedOverflows = 0;

    bins.forEach((b) => {
      totalFill += b.currentFillPercentage || 0;
      if (b.status === 'critical') criticalBins++;
      else if (b.status === 'warning') warningBins++;
      else normalBins++;

      if (b.predictedOverflowHours && b.predictedOverflowHours <= 12) {
        predictedOverflows++;
      }
    });

    const averageFillPercentage = totalBins > 0 ? Math.round((totalFill / totalBins) * 10) / 10 : 0;

    // Tasks metrics
    const scheduledToday = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
    const pendingTasks = tasks.filter((t) => t.status === 'pending').length;

    res.status(200).json({
      success: true,
      kpis: {
        totalBins,
        normalBins,
        warningBins,
        criticalBins,
        scheduledToday,
        pendingTasks,
        averageFillPercentage,
        predictedOverflows,
        activeAlertsCount: alerts.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const ingestSensorReading = async (req, res, next) => {
  try {
    const { binId, fillPercentage, source = 'sensor', batteryLevel, temperatureCelsius } = req.body;

    if (!binId || fillPercentage === undefined) {
      return res.status(400).json({ success: false, message: 'binId and fillPercentage are required.' });
    }

    const bin = await binRepo.findByBinId(binId);
    if (!bin) {
      return res.status(404).json({ success: false, message: `Bin ${binId} not registered in system.` });
    }

    const fill = Math.min(100, Math.max(0, Number(fillPercentage)));
    let status = 'normal';
    if (fill >= (bin.criticalThreshold || 80)) status = 'critical';
    else if (fill >= (bin.warningThreshold || 60)) status = 'warning';

    const reading = {
      timestamp: new Date(),
      fillPercentage: fill,
      source,
    };

    const recentReadings = [...(bin.recentReadings || []), reading].slice(-20);

    // Persist fill log
    await fillLogRepo.create({
      bin: bin._id,
      binId: bin.binId,
      fillPercentage: fill,
      source,
      readingTimestamp: new Date(),
    });

    const updatedBin = await binRepo.updateById(bin._id, {
      currentFillPercentage: fill,
      status,
      lastReadingAt: new Date(),
      recentReadings,
    });

    // Alert check
    if (status === 'critical') {
      const existingAlert = await alertRepo.findActiveByBinAndType(bin.binId, 'threshold_exceeded');
      if (!existingAlert) {
        const alert = await alertRepo.create({
          alertType: 'threshold_exceeded',
          severity: 'critical',
          bin: bin._id,
          binId: bin.binId,
          ward: bin.ward,
          message: `Hardware Sensor Alert: Bin ${bin.binId} crossed ${fill}% fill capacity!`,
          resolved: false,
        });
        emitAlert(alert);
      }
    }

    emitBinUpdate(updatedBin);

    res.status(200).json({
      success: true,
      message: 'Sensor reading ingested successfully',
      data: {
        binId: updatedBin.binId,
        fillPercentage: fill,
        status,
        timestamp: new Date(),
        source,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getSimulatorStatus = (req, res) => {
  res.status(200).json({
    success: true,
    ...getSimulatorState(),
  });
};

const toggleSimulator = (req, res) => {
  const { action, intervalMs } = req.body;
  if (action === 'start') {
    startSimulator(intervalMs ? Number(intervalMs) : undefined);
  } else if (action === 'stop') {
    stopSimulator();
  } else {
    // Toggle
    const current = getSimulatorState();
    if (current.isRunning) stopSimulator();
    else startSimulator(intervalMs ? Number(intervalMs) : undefined);
  }

  res.status(200).json({
    success: true,
    ...getSimulatorState(),
  });
};

const triggerSimulationStep = async (req, res, next) => {
  try {
    await runSimulationStep();
    res.status(200).json({
      success: true,
      message: 'Simulation step executed manually.',
      ...getSimulatorState(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardKPIs,
  ingestSensorReading,
  getSimulatorStatus,
  toggleSimulator,
  triggerSimulationStep,
};
