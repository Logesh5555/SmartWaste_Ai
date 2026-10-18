const { binRepo, fillLogRepo, alertRepo } = require('../models/dataRepository');
const { emitBinUpdate, emitAlert, emitSimulatorStatus } = require('./socketService');
const { getPredictionForBin } = require('./mlClientService');
const config = require('../config/config');

let simulatorTimer = null;
let isSimulatorRunning = false;
let currentIntervalMs = config.simulatorIntervalMs || 5000;
let simulationCycles = 0;

const runSimulationStep = async () => {
  try {
    const bins = await binRepo.find({});
    if (!bins || bins.length === 0) return;

    simulationCycles++;
    // Randomly select 2-4 bins to simulate new readings
    const candidateCount = Math.min(bins.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = [...bins].sort(() => 0.5 - Math.random());
    const selectedBins = shuffled.slice(0, candidateCount);

    for (const bin of selectedBins) {
      // Natural fill progression (1% to 4% increment, with slight occasional variation)
      const increment = Math.round((Math.random() * 3.5 + 0.5) * 10) / 10;
      let newFill = Math.min(100, Math.round(((bin.currentFillPercentage || 0) + increment) * 10) / 10);

      // Determine status
      let newStatus = 'normal';
      if (newFill >= (bin.criticalThreshold || 80)) {
        newStatus = 'critical';
      } else if (newFill >= (bin.warningThreshold || 60)) {
        newStatus = 'warning';
      }

      // Add recent reading
      const reading = {
        timestamp: new Date(),
        fillPercentage: newFill,
        source: 'simulator',
      };

      const recentReadings = [...(bin.recentReadings || []), reading].slice(-20);

      // Save log entry
      await fillLogRepo.create({
        bin: bin._id,
        binId: bin.binId,
        fillPercentage: newFill,
        source: 'simulator',
        readingTimestamp: new Date(),
      });

      // Update bin in repository
      const updatedBin = await binRepo.updateById(bin._id, {
        currentFillPercentage: newFill,
        status: newStatus,
        lastReadingAt: new Date(),
        recentReadings,
      });

      // Deduplicated alert check
      if (newStatus === 'critical') {
        const existingAlert = await alertRepo.findActiveByBinAndType(bin.binId, 'threshold_exceeded');
        if (!existingAlert) {
          const newAlert = await alertRepo.create({
            alertType: 'threshold_exceeded',
            severity: 'critical',
            bin: bin._id,
            binId: bin.binId,
            ward: bin.ward,
            message: `Threshold Alert: ${bin.label} (${bin.binId}) reached ${newFill}% capacity. Immediate clearance scheduled.`,
            resolved: false,
          });
          emitAlert(newAlert);
        }
      }

      // Emit real-time WebSocket event
      emitBinUpdate(updatedBin);
    }
  } catch (err) {
    console.error('Simulation step error:', err.message);
  }
};

const startSimulator = (intervalMs) => {
  if (intervalMs) currentIntervalMs = intervalMs;
  if (simulatorTimer) clearInterval(simulatorTimer);

  isSimulatorRunning = true;
  simulatorTimer = setInterval(runSimulationStep, currentIntervalMs);
  emitSimulatorStatus({ isRunning: true, intervalMs: currentIntervalMs });
  console.log(`Simulator running at ${currentIntervalMs}ms intervals.`);
};

const stopSimulator = () => {
  if (simulatorTimer) {
    clearInterval(simulatorTimer);
    simulatorTimer = null;
  }
  isSimulatorRunning = false;
  emitSimulatorStatus({ isRunning: false, intervalMs: currentIntervalMs });
  console.log('Simulator stopped.');
};

const getSimulatorState = () => ({
  isRunning: isSimulatorRunning,
  intervalMs: currentIntervalMs,
  cyclesCompleted: simulationCycles,
});

module.exports = {
  startSimulator,
  stopSimulator,
  getSimulatorState,
  runSimulationStep,
};
