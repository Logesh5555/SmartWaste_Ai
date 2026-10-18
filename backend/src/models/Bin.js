const mongoose = require('mongoose');

const binSchema = new mongoose.Schema(
  {
    binId: {
      type: String,
      required: [true, 'Bin ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    label: {
      type: String,
      required: [true, 'Bin label is required'],
      trim: true,
    },
    location: {
      address: {
        type: String,
        default: 'Metropolitan Area',
      },
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    ward: {
      type: String,
      required: [true, 'Ward/Area is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['general', 'recyclable', 'organic', 'hazardous'],
      default: 'general',
      index: true,
    },
    capacityLiters: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000,
    },
    currentFillPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    criticalThreshold: {
      type: Number,
      default: 80,
      min: 50,
      max: 95,
    },
    warningThreshold: {
      type: Number,
      default: 60,
      min: 30,
      max: 85,
    },
    status: {
      type: String,
      enum: ['normal', 'warning', 'critical', 'damaged', 'in_collection'],
      default: 'normal',
      index: true,
    },
    lastCollectedAt: {
      type: Date,
      default: () => new Date(Date.now() - 36 * 3600 * 1000),
    },
    lastReadingAt: {
      type: Date,
      default: Date.now,
    },
    sensorId: {
      type: String,
      default: () => `IOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    },
    predictedOverflowHours: {
      type: Number,
      default: null,
    },
    recentReadings: [
      {
        timestamp: { type: Date, default: Date.now },
        fillPercentage: Number,
        source: { type: String, default: 'simulator' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

binSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Bin', binSchema);
