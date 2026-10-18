const mongoose = require('mongoose');

const fillLogSchema = new mongoose.Schema(
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
      index: true,
    },
    fillPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    source: {
      type: String,
      enum: ['sensor', 'simulator', 'manual'],
      default: 'simulator',
    },
    readingTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

fillLogSchema.index({ bin: 1, readingTimestamp: -1 });

module.exports = mongoose.model('FillLog', fillLogSchema);
