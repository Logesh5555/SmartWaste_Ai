const { taskRepo, binRepo, alertRepo, activityRepo } = require('../models/dataRepository');
const { optimizeRoute } = require('../services/routeOptimizationService');
const { emitTaskUpdate, emitBinUpdate, emitAlert } = require('../services/socketService');

const getTasks = async (req, res, next) => {
  try {
    const { status, ward, assignedTo } = req.query;
    const filter = {};

    // If staff user is querying and not admin/officer, auto-filter to their assigned tasks
    if (req.user && req.user.role === 'staff') {
      filter.assignedTo = req.user._id || req.user.id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    if (status) filter.status = status;
    if (ward) filter.ward = ward;

    const tasks = await taskRepo.find(filter);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    next(err);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await taskRepo.findById(id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Collection task not found.' });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (err) {
    next(err);
  }
};

const previewRouteOptimization = async (req, res, next) => {
  try {
    const { binIds, depotCoordinates = [77.5946, 12.9716] } = req.body;

    if (!binIds || !Array.isArray(binIds) || binIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of binIds is required.' });
    }

    const bins = [];
    for (const id of binIds) {
      const b = await binRepo.findById(id);
      if (b) bins.push(b);
    }

    const optimizationResult = optimizeRoute(bins, depotCoordinates);

    res.status(200).json({
      success: true,
      result: optimizationResult,
    });
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const {
      title,
      binIds,
      assignedTo,
      priority = 'normal',
      ward = 'Ward-1 Central Market',
      scheduledDate = new Date(),
      autoOptimize = true,
      notes = '',
    } = req.body;

    if (!binIds || !Array.isArray(binIds) || binIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one bin for collection.' });
    }

    const targetBins = [];
    for (const bId of binIds) {
      const binObj = await binRepo.findById(bId);
      if (binObj) targetBins.push(binObj);
    }

    // Run route optimization
    const routeOpt = autoOptimize ? optimizeRoute(targetBins) : null;

    const routeDetails = routeOpt
      ? {
          estimatedDistanceKm: routeOpt.totalDistanceKm,
          estimatedDurationMin: routeOpt.totalDurationMin,
          fuelSavedLiters: routeOpt.fuelSavedLiters,
          co2SavedKg: routeOpt.co2SavedKg,
          waypoints: routeOpt.waypoints,
        }
      : {
          estimatedDistanceKm: 5.0,
          estimatedDurationMin: 30,
          fuelSavedLiters: 1.0,
          co2SavedKg: 2.5,
          waypoints: targetBins.map((b, i) => ({
            binId: b.binId,
            label: b.label,
            coordinates: b.location?.coordinates || [77.5946, 12.9716],
            order: i + 1,
          })),
        };

    const initialFillBeforeAfter = targetBins.map((b) => ({
      bin: b._id,
      binId: b.binId,
      fillBefore: b.currentFillPercentage || 0,
      fillAfter: 0,
    }));

    const task = await taskRepo.create({
      title: title || `Collection Route: ${ward}`,
      bins: targetBins.map((b) => b._id),
      assignedTo: assignedTo || null,
      status: assignedTo ? 'assigned' : 'pending',
      priority,
      ward,
      scheduledDate,
      routeDetails,
      fillBeforeAfter: initialFillBeforeAfter,
      notes,
    });

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Administrator',
      action: `Created task ${task.taskNumber}`,
      entityType: 'task',
      entityId: task.taskNumber,
      details: { binsCount: targetBins.length, ward },
    });

    emitTaskUpdate(task);

    res.status(201).json({
      success: true,
      message: 'Collection task created successfully',
      task,
    });
  } catch (err) {
    next(err);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, collectedWeightKg, notes, fillAfterValues } = req.body;

    const task = await taskRepo.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const updates = {};
    if (status) updates.status = status;
    if (collectedWeightKg !== undefined) updates.collectedWeightKg = Number(collectedWeightKg);
    if (notes) updates.notes = notes;

    if (status === 'in_progress' && !task.startedAt) {
      updates.startedAt = new Date();
    }

    if (status === 'completed') {
      updates.completedAt = new Date();

      // Reset bins to empty / normal status
      const updatedFillList = [];
      for (const b of task.bins || []) {
        const binId = b._id || b;
        const binRecord = await binRepo.findById(binId);
        if (binRecord) {
          const afterFill = fillAfterValues && fillAfterValues[binRecord.binId] !== undefined
            ? Number(fillAfterValues[binRecord.binId])
            : 5; // Standard post-clearance residual

          updatedFillList.push({
            bin: binRecord._id,
            binId: binRecord.binId,
            fillBefore: binRecord.currentFillPercentage || 0,
            fillAfter: afterFill,
          });

          // Reset bin state
          const clearedBin = await binRepo.updateById(binRecord._id, {
            currentFillPercentage: afterFill,
            status: 'normal',
            lastCollectedAt: new Date(),
            lastReadingAt: new Date(),
            predictedOverflowHours: 36.0,
            recentReadings: [
              ...(binRecord.recentReadings || []),
              { timestamp: new Date(), fillPercentage: afterFill, source: 'manual' },
            ].slice(-20),
          });

          // Resolve active overflow alerts for this bin
          const activeAlert = await alertRepo.findActiveByBinAndType(binRecord.binId, 'threshold_exceeded');
          if (activeAlert) {
            await alertRepo.updateById(activeAlert._id, {
              resolved: true,
              resolvedBy: req.user?._id,
              resolvedAt: new Date(),
            });
          }

          emitBinUpdate(clearedBin);
        }
      }

      if (updatedFillList.length > 0) {
        updates.fillBeforeAfter = updatedFillList;
      }
    }

    const updatedTask = await taskRepo.updateById(task._id, updates);

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: `Updated task ${task.taskNumber} to ${status}`,
      entityType: 'task',
      entityId: task.taskNumber,
    });

    emitTaskUpdate(updatedTask);

    res.status(200).json({
      success: true,
      message: `Task updated to ${status}`,
      task: updatedTask,
    });
  } catch (err) {
    next(err);
  }
};

const reportIssue = async (req, res, next) => {
  try {
    const { binId, issueType = 'damaged_bin', description, severity = 'high' } = req.body;

    if (!binId || !description) {
      return res.status(400).json({ success: false, message: 'binId and description are required.' });
    }

    const bin = await binRepo.findByBinId(binId);
    if (bin) {
      if (issueType === 'damaged_bin') {
        await binRepo.updateById(bin._id, { status: 'damaged' });
        emitBinUpdate({ ...bin, status: 'damaged' });
      }
    }

    const alert = await alertRepo.create({
      alertType: issueType,
      severity,
      bin: bin ? bin._id : null,
      binId: binId.toUpperCase(),
      ward: bin ? bin.ward : 'Unspecified',
      message: `Field Report: ${description} (Reported by ${req.user?.name || 'Municipal Staff'})`,
      resolved: false,
    });

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Staff',
      action: `Reported issue on ${binId}: ${issueType}`,
      entityType: 'alert',
      entityId: String(alert._id),
    });

    emitAlert(alert);

    res.status(201).json({
      success: true,
      message: 'Issue reported and maintenance alert dispatched.',
      alert,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  previewRouteOptimization,
  createTask,
  updateTaskStatus,
  reportIssue,
};
