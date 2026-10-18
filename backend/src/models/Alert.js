const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    alertType: {
      type: String,
      enum: ['threshold_exceeded', 'overflow_predicted', 'stale_sensor', 'damaged_bin', 'delayed_task'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true,
    },
    bin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bin',
      default: null,
      index: true,
    },
    binId: {
      type: String,
      default: '',
    },
    ward: {
      type: String,
      default: '',
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ bin: 1, alertType: 1, resolved: 1 });

module.exports = mongoose.model('Alert', alertSchema);
