const mongoose = require('mongoose');
const config = require('../config/config');
const User = require('../models/User');
const Bin = require('../models/Bin');
const Alert = require('../models/Alert');
const CollectionTask = require('../models/CollectionTask');
const ActivityLog = require('../models/ActivityLog');
const FillLog = require('../models/FillLog');
const { generateSampleData } = require('./sampleData');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB.');

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Bin.deleteMany({});
    await Alert.deleteMany({});
    await CollectionTask.deleteMany({});
    await ActivityLog.deleteMany({});
    await FillLog.deleteMany({});

    console.log('Generating sample data...');
    const data = await generateSampleData();

    console.log(`Inserting ${data.users.length} users...`);
    await User.insertMany(data.users);

    console.log(`Inserting ${data.bins.length} bins...`);
    await Bin.insertMany(data.bins);

    console.log(`Inserting ${data.alerts.length} alerts...`);
    await Alert.insertMany(data.alerts);

    console.log(`Inserting ${data.tasks.length} collection tasks...`);
    await CollectionTask.insertMany(data.tasks);

    console.log(`Inserting ${data.activityLogs.length} activity logs...`);
    await ActivityLog.insertMany(data.activityLogs);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();
