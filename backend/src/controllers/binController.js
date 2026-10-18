const { binRepo, fillLogRepo, activityRepo } = require('../models/dataRepository');
const { emitBinUpdate } = require('../services/socketService');
const { getPredictionForBin } = require('../services/mlClientService');

const getAllBins = async (req, res, next) => {
  try {
    const { ward, category, status, search } = req.query;
    const filter = {};
    if (ward) filter.ward = ward;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.search = search;

    const bins = await binRepo.find(filter);

    res.status(200).json({
      success: true,
      count: bins.length,
      bins,
    });
  } catch (err) {
    next(err);
  }
};

const getBinById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bin = await binRepo.findById(id);

    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    // Fetch historical logs
    const history = await fillLogRepo.findByBinId(bin.binId, 30);

    // Compute fresh ML prediction
    const prediction = await getPredictionForBin(bin);

    res.status(200).json({
      success: true,
      bin,
      history,
      prediction,
    });
  } catch (err) {
    next(err);
  }
};

const createBin = async (req, res, next) => {
  try {
    const {
      binId,
      label,
      ward,
      category = 'general',
      capacityLiters = 1000,
      coordinates = [77.5946, 12.9716],
      address = 'Metropolitan Area',
      criticalThreshold = 80,
      warningThreshold = 60,
      currentFillPercentage = 0,
    } = req.body;

    if (!binId || !label || !ward) {
      return res.status(400).json({ success: false, message: 'binId, label, and ward are required.' });
    }

    const existing = await binRepo.findByBinId(binId);
    if (existing) {
      return res.status(400).json({ success: false, message: `Bin with ID ${binId} already exists.` });
    }

    let status = 'normal';
    if (currentFillPercentage >= criticalThreshold) status = 'critical';
    else if (currentFillPercentage >= warningThreshold) status = 'warning';

    const newBin = await binRepo.create({
      binId: binId.toUpperCase().trim(),
      label,
      ward,
      category,
      capacityLiters: Number(capacityLiters),
      location: {
        address,
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      },
      currentFillPercentage: Number(currentFillPercentage),
      criticalThreshold: Number(criticalThreshold),
      warningThreshold: Number(warningThreshold),
      status,
    });

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Administrator',
      action: `Created new waste bin ${newBin.binId}`,
      entityType: 'bin',
      entityId: newBin.binId,
      details: { ward: newBin.ward, category: newBin.category },
    });

    emitBinUpdate(newBin);

    res.status(201).json({
      success: true,
      message: 'Waste bin created successfully',
      bin: newBin,
    });
  } catch (err) {
    next(err);
  }
};

const updateBin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bin = await binRepo.findById(id);

    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    const updates = { ...req.body };

    // Maintain status consistency if fill or thresholds updated
    if (updates.currentFillPercentage !== undefined || updates.criticalThreshold !== undefined) {
      const fill = updates.currentFillPercentage !== undefined ? updates.currentFillPercentage : bin.currentFillPercentage;
      const crit = updates.criticalThreshold !== undefined ? updates.criticalThreshold : bin.criticalThreshold;
      const warn = updates.warningThreshold !== undefined ? updates.warningThreshold : bin.warningThreshold;

      if (fill >= crit) updates.status = 'critical';
      else if (fill >= warn) updates.status = 'warning';
      else updates.status = 'normal';
    }

    const updated = await binRepo.updateById(bin._id, updates);

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'User',
      action: `Updated bin ${updated.binId}`,
      entityType: 'bin',
      entityId: updated.binId,
    });

    emitBinUpdate(updated);

    res.status(200).json({
      success: true,
      message: 'Waste bin updated successfully',
      bin: updated,
    });
  } catch (err) {
    next(err);
  }
};

const deleteBin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bin = await binRepo.findById(id);

    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    await binRepo.deleteById(bin._id);

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Administrator',
      action: `Deleted bin ${bin.binId}`,
      entityType: 'bin',
      entityId: bin.binId,
    });

    res.status(200).json({
      success: true,
      message: `Bin ${bin.binId} deleted successfully`,
    });
  } catch (err) {
    next(err);
  }
};

const getBinHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bin = await binRepo.findById(id);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Waste bin not found.' });
    }

    const limit = parseInt(req.query.limit || '50', 10);
    const history = await fillLogRepo.findByBinId(bin.binId, limit);

    res.status(200).json({
      success: true,
      binId: bin.binId,
      count: history.length,
      history,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllBins,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
  getBinHistory,
};
