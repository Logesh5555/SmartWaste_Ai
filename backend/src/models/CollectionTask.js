const mongoose = require('mongoose');

const collectionTaskSchema = new mongoose.Schema(
  {
    taskNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    title: {
      type: String,
      default: 'Optimized Waste Collection Route',
    },
    bins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bin',
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'delayed'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'critical'],
      default: 'normal',
      index: true,
    },
    ward: {
      type: String,
      default: 'Ward-1 Central Market',
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    routeDetails: {
      estimatedDistanceKm: { type: Number, default: 0 },
      estimatedDurationMin: { type: Number, default: 0 },
      fuelSavedLiters: { type: Number, default: 0 },
      co2SavedKg: { type: Number, default: 0 },
      waypoints: [
        {
          binId: String,
          label: String,
          coordinates: [Number],
          order: Number,
        },
      ],
    },
    collectedWeightKg: {
      type: Number,
      default: 0,
    },
    fillBeforeAfter: [
      {
        bin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin' },
        binId: String,
        fillBefore: Number,
        fillAfter: Number,
      },
    ],
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CollectionTask', collectionTaskSchema);
