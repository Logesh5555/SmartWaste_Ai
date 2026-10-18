const { binRepo } = require('../models/dataRepository');
const {
  getPredictionForBin,
  getBatchPredictions,
  getMlModelMetrics,
} = require('../services/mlClientService');

const getBinPrediction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bin = await binRepo.findById(id);

    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found.' });
    }

    const prediction = await getPredictionForBin(bin);

    // Update bin's predicted overflow hours cache
    if (prediction.estimated_hours_to_overflow !== undefined) {
      await binRepo.updateById(bin._id, {
        predictedOverflowHours: prediction.estimated_hours_to_overflow,
      });
    }

    res.status(200).json({
      success: true,
      bin: {
        id: bin._id,
        binId: bin.binId,
        label: bin.label,
        ward: bin.ward,
        category: bin.category,
      },
      prediction,
    });
  } catch (err) {
    next(err);
  }
};

const getAllPredictions = async (req, res, next) => {
  try {
    const bins = await binRepo.find({});
    const predictions = await getBatchPredictions(bins);

    // Categorize by risk urgency
    const imminentOverflows = [];
    const highRisk = [];
    const normalRisk = [];

    predictions.forEach((p, idx) => {
      const bin = bins[idx];
      const item = { ...p, label: bin.label, ward: bin.ward, category: bin.category };

      if (p.estimated_hours_to_overflow !== null && p.estimated_hours_to_overflow <= 6) {
        imminentOverflows.push(item);
      } else if (p.estimated_hours_to_overflow !== null && p.estimated_hours_to_overflow <= 14) {
        highRisk.push(item);
      } else {
        normalRisk.push(item);
      }
    });

    res.status(200).json({
      success: true,
      totalAnalyzed: predictions.length,
      summary: {
        imminentCount: imminentOverflows.length,
        highRiskCount: highRisk.length,
        normalRiskCount: normalRisk.length,
      },
      imminentOverflows,
      highRisk,
      allPredictions: predictions,
    });
  } catch (err) {
    next(err);
  }
};

const getModelMetrics = async (req, res, next) => {
  try {
    const metrics = await getMlModelMetrics();
    res.status(200).json({
      success: true,
      metrics,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getBinPrediction,
  getAllPredictions,
  getModelMetrics,
};
