const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    bin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bin',
      required: true,
      index: true,
    },
    binId: {
      type: String,
      required: true,
    },
    horizonHours: {
      type: Number,
      required: true,
      enum: [6, 12, 24],
    },
    predictedFillPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeToOverflowHours: {
      type: Number,
      default: null,
    },
    confidence: {
      type: Number,
      default: 0.9,
    },
    modelVersion: {
      type: String,
      default: '1.2.0',
    },
    predictionSource: {
      type: String,
      enum: ['ml_random_forest_regressor', 'baseline_heuristic_rate'],
      default: 'ml_random_forest_regressor',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

predictionSchema.index({ bin: 1, generatedAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
