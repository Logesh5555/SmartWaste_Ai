const { isUsingMemoryStore, getMemoryStore } = require('../config/db');
const User = require('./User');
const Bin = require('./Bin');
const FillLog = require('./FillLog');
const Prediction = require('./Prediction');
const CollectionTask = require('./CollectionTask');
const Alert = require('./Alert');
const ActivityLog = require('./ActivityLog');

// Generate MongoDB-like 24-char hex ID
const generateId = () => '6601' + Math.random().toString(16).substring(2, 22).padEnd(20, '0');

// User Repository
const userRepo = {
  async find(filter = {}) {
    if (!isUsingMemoryStore()) return User.find(filter).select('-password');
    let res = getMemoryStore().users;
    if (filter.role) res = res.filter((u) => u.role === filter.role);
    if (filter.status) res = res.filter((u) => u.status === filter.status);
    return res.map(({ password, ...rest }) => rest);
  },

  async findById(id) {
    if (!isUsingMemoryStore()) return User.findById(id).select('-password');
    const u = getMemoryStore().users.find((u) => String(u._id) === String(id));
    if (!u) return null;
    const { password, ...rest } = u;
    return rest;
  },

  async findByEmail(email, includePassword = false) {
    if (!isUsingMemoryStore()) {
      const q = User.findOne({ email: email.toLowerCase() });
      if (includePassword) q.select('+password');
      return q;
    }
    const u = getMemoryStore().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!u) return null;
    if (includePassword) return u;
    const { password, ...rest } = u;
    return rest;
  },

  async create(userData) {
    if (!isUsingMemoryStore()) return User.create(userData);
    const store = getMemoryStore();
    const newUser = {
      _id: generateId(),
      ...userData,
      status: userData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.users.push(newUser);
    const { password, ...rest } = newUser;
    return rest;
  },

  async updateById(id, updates) {
    if (!isUsingMemoryStore()) return User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    const store = getMemoryStore();
    const idx = store.users.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...updates, updatedAt: new Date() };
    const { password, ...rest } = store.users[idx];
    return rest;
  },

  async count() {
    if (!isUsingMemoryStore()) return User.countDocuments();
    return getMemoryStore().users.length;
  },
};

// Bin Repository
const binRepo = {
  async find(filter = {}, sort = { currentFillPercentage: -1 }) {
    if (!isUsingMemoryStore()) return Bin.find(filter).sort(sort);
    let res = [...getMemoryStore().bins];
    if (filter.ward) res = res.filter((b) => b.ward === filter.ward);
    if (filter.category) res = res.filter((b) => b.category === filter.category);
    if (filter.status) res = res.filter((b) => b.status === filter.status);
    if (filter.search) {
      const s = filter.search.toLowerCase();
      res = res.filter(
        (b) =>
          b.binId.toLowerCase().includes(s) ||
          b.label.toLowerCase().includes(s) ||
          b.ward.toLowerCase().includes(s)
      );
    }
    return res.sort((a, b) => (b.currentFillPercentage || 0) - (a.currentFillPercentage || 0));
  },

  async findById(id) {
    if (!isUsingMemoryStore()) return Bin.findById(id);
    return getMemoryStore().bins.find((b) => String(b._id) === String(id) || b.binId === id) || null;
  },

  async findByBinId(binId) {
    if (!isUsingMemoryStore()) return Bin.findOne({ binId: binId.toUpperCase() });
    return getMemoryStore().bins.find((b) => b.binId.toUpperCase() === binId.toUpperCase()) || null;
  },

  async create(data) {
    if (!isUsingMemoryStore()) return Bin.create(data);
    const store = getMemoryStore();
    const newBin = {
      _id: generateId(),
      ...data,
      currentFillPercentage: data.currentFillPercentage || 0,
      status: data.status || 'normal',
      lastReadingAt: new Date(),
      recentReadings: [
        { timestamp: new Date(), fillPercentage: data.currentFillPercentage || 0, source: 'manual' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.bins.push(newBin);
    return newBin;
  },

  async updateById(id, updates) {
    if (!isUsingMemoryStore()) return Bin.findByIdAndUpdate(id, updates, { new: true });
    const store = getMemoryStore();
    const idx = store.bins.findIndex((b) => String(b._id) === String(id) || b.binId === id);
    if (idx === -1) return null;
    store.bins[idx] = { ...store.bins[idx], ...updates, updatedAt: new Date() };
    return store.bins[idx];
  },

  async deleteById(id) {
    if (!isUsingMemoryStore()) return Bin.findByIdAndDelete(id);
    const store = getMemoryStore();
    const idx = store.bins.findIndex((b) => String(b._id) === String(id) || b.binId === id);
    if (idx === -1) return null;
    const removed = store.bins.splice(idx, 1);
    return removed[0];
  },

  async count(filter = {}) {
    if (!isUsingMemoryStore()) return Bin.countDocuments(filter);
    return (await this.find(filter)).length;
  },
};

// FillLog Repository
const fillLogRepo = {
  async create(data) {
    if (!isUsingMemoryStore()) return FillLog.create(data);
    const store = getMemoryStore();
    const log = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
    };
    store.fillLogs.push(log);
    return log;
  },

  async findByBinId(binId, limit = 50) {
    if (!isUsingMemoryStore()) {
      return FillLog.find({ binId }).sort({ readingTimestamp: -1 }).limit(limit);
    }
    return getMemoryStore()
      .fillLogs.filter((l) => l.binId === binId)
      .sort((a, b) => new Date(b.readingTimestamp) - new Date(a.readingTimestamp))
      .slice(0, limit);
  },

  async getAll(limit = 200) {
    if (!isUsingMemoryStore()) return FillLog.find().sort({ readingTimestamp: -1 }).limit(limit);
    return [...getMemoryStore().fillLogs]
      .sort((a, b) => new Date(b.readingTimestamp) - new Date(a.readingTimestamp))
      .slice(0, limit);
  },
};

// Prediction Repository
const predictionRepo = {
  async create(data) {
    if (!isUsingMemoryStore()) return Prediction.create(data);
    const store = getMemoryStore();
    const pred = {
      _id: generateId(),
      ...data,
      generatedAt: new Date(),
      createdAt: new Date(),
    };
    store.predictions.push(pred);
    return pred;
  },

  async getLatestForBin(binId) {
    if (!isUsingMemoryStore()) {
      return Prediction.find({ binId }).sort({ generatedAt: -1 }).limit(3);
    }
    return getMemoryStore()
      .predictions.filter((p) => p.binId === binId)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(0, 3);
  },
};

// CollectionTask Repository
const taskRepo = {
  async find(filter = {}) {
    if (!isUsingMemoryStore()) return CollectionTask.find(filter).populate('bins').populate('assignedTo', '-password');
    const store = getMemoryStore();
    let res = [...store.tasks];
    if (filter.status) res = res.filter((t) => t.status === filter.status);
    if (filter.assignedTo) res = res.filter((t) => String(t.assignedTo) === String(filter.assignedTo));
    if (filter.ward) res = res.filter((t) => t.ward === filter.ward);

    // populate bins and assignedTo
    return res.map((t) => {
      const populatedBins = (t.bins || []).map((bId) => store.bins.find((b) => String(b._id) === String(bId)) || bId);
      const user = store.users.find((u) => String(u._id) === String(t.assignedTo));
      const populatedUser = user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone } : null;
      return { ...t, bins: populatedBins, assignedTo: populatedUser };
    });
  },

  async findById(id) {
    if (!isUsingMemoryStore()) return CollectionTask.findById(id).populate('bins').populate('assignedTo', '-password');
    const store = getMemoryStore();
    const t = store.tasks.find((t) => String(t._id) === String(id) || t.taskNumber === id);
    if (!t) return null;
    const populatedBins = (t.bins || []).map((bId) => store.bins.find((b) => String(b._id) === String(bId)) || bId);
    const user = store.users.find((u) => String(u._id) === String(t.assignedTo));
    const populatedUser = user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone } : null;
    return { ...t, bins: populatedBins, assignedTo: populatedUser };
  },

  async create(taskData) {
    if (!isUsingMemoryStore()) return CollectionTask.create(taskData);
    const store = getMemoryStore();
    const newTask = {
      _id: generateId(),
      taskNumber: taskData.taskNumber || `TASK-2026-${String(store.tasks.length + 1).padStart(3, '0')}`,
      ...taskData,
      status: taskData.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.tasks.push(newTask);
    return newTask;
  },

  async updateById(id, updates) {
    if (!isUsingMemoryStore()) return CollectionTask.findByIdAndUpdate(id, updates, { new: true });
    const store = getMemoryStore();
    const idx = store.tasks.findIndex((t) => String(t._id) === String(id) || t.taskNumber === id);
    if (idx === -1) return null;
    store.tasks[idx] = { ...store.tasks[idx], ...updates, updatedAt: new Date() };
    return store.tasks[idx];
  },
};

// Alert Repository
const alertRepo = {
  async find(filter = {}) {
    if (!isUsingMemoryStore()) return Alert.find(filter).sort({ createdAt: -1 }).populate('bin').populate('resolvedBy', 'name email');
    const store = getMemoryStore();
    let res = [...store.alerts];
    if (filter.resolved !== undefined) res = res.filter((a) => a.resolved === filter.resolved);
    if (filter.severity) res = res.filter((a) => a.severity === filter.severity);
    if (filter.ward) res = res.filter((a) => a.ward === filter.ward);
    return res.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(id) {
    if (!isUsingMemoryStore()) return Alert.findById(id);
    return getMemoryStore().alerts.find((a) => String(a._id) === String(id)) || null;
  },

  async create(data) {
    if (!isUsingMemoryStore()) return Alert.create(data);
    const store = getMemoryStore();
    const newAlert = {
      _id: generateId(),
      ...data,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.alerts.unshift(newAlert);
    return newAlert;
  },

  async updateById(id, updates) {
    if (!isUsingMemoryStore()) return Alert.findByIdAndUpdate(id, updates, { new: true });
    const store = getMemoryStore();
    const idx = store.alerts.findIndex((a) => String(a._id) === String(id));
    if (idx === -1) return null;
    store.alerts[idx] = { ...store.alerts[idx], ...updates, updatedAt: new Date() };
    return store.alerts[idx];
  },

  async findActiveByBinAndType(binId, alertType) {
    if (!isUsingMemoryStore()) return Alert.findOne({ binId, alertType, resolved: false });
    return getMemoryStore().alerts.find((a) => a.binId === binId && a.alertType === alertType && !a.resolved) || null;
  },
};

// Activity Log Repository
const activityRepo = {
  async create(data) {
    if (!isUsingMemoryStore()) return ActivityLog.create(data);
    const store = getMemoryStore();
    const log = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
    };
    store.activityLogs.unshift(log);
    return log;
  },

  async find(limit = 50) {
    if (!isUsingMemoryStore()) return ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
    return [...getMemoryStore().activityLogs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },
};

module.exports = {
  userRepo,
  binRepo,
  fillLogRepo,
  predictionRepo,
  taskRepo,
  alertRepo,
  activityRepo,
};
