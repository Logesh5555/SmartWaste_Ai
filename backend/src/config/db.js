const mongoose = require('mongoose');
const config = require('./config');
const { generateSampleData } = require('../seed/sampleData');

let isMemoryStore = false;

// In-Memory Data Store for resilient demo/standalone mode
const memoryStore = {
  users: [],
  bins: [],
  fillLogs: [],
  predictions: [],
  tasks: [],
  alerts: [],
  activityLogs: [],
};

const initializeMemoryStore = async () => {
  const data = await generateSampleData();
  memoryStore.users = data.users;
  memoryStore.bins = data.bins;
  memoryStore.alerts = data.alerts;
  memoryStore.tasks = data.tasks;
  memoryStore.activityLogs = data.activityLogs;

  // Generate initial fill logs from bins
  data.bins.forEach((b) => {
    b.recentReadings.forEach((r) => {
      memoryStore.fillLogs.push({
        _id: '6601f' + Math.random().toString(16).substring(2, 18),
        bin: b._id,
        binId: b.binId,
        fillPercentage: r.fillPercentage,
        source: r.source || 'simulator',
        readingTimestamp: r.timestamp,
        createdAt: r.timestamp,
      });
    });
  });

  console.log('High-Fidelity In-Memory Data Store initialized with sample municipal dataset.');
};

const connectDB = async () => {
  if (config.mongoUri && config.mongoUri.startsWith('mongodb')) {
    try {
      console.log(`Connecting to MongoDB at: ${config.mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')} ...`);
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 2500,
      });
      isMemoryStore = false;
      console.log('Connected to MongoDB successfully.');
      return;
    } catch (err) {
      console.warn(`MongoDB connection failed (${err.message}). Activating In-Memory High-Fidelity Data Store...`);
    }
  }

  isMemoryStore = true;
  await initializeMemoryStore();
};

const isUsingMemoryStore = () => isMemoryStore;
const getMemoryStore = () => memoryStore;

module.exports = {
  connectDB,
  isUsingMemoryStore,
  getMemoryStore,
};
