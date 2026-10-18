const bcrypt = require('bcryptjs');
const { userRepo, activityRepo } = require('../models/dataRepository');

const getAllUsers = async (req, res, next) => {
  try {
    const { role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await userRepo.find(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password = 'password123', role = 'staff', phone = '', assignedWard = 'Ward-1 Central Market' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userRepo.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone,
      assignedWard,
      status: 'active',
    });

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: `Created new user ${user.name} (${user.role})`,
      entityType: 'user',
      entityId: String(user._id),
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, role, assignedWard } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (role) updates.role = role;
    if (assignedWard) updates.assignedWard = assignedWard;

    const updated = await userRepo.updateById(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await activityRepo.create({
      user: req.user?._id,
      userName: req.user?.name || 'Admin',
      action: `Updated user ${updated.name}: ${JSON.stringify(updates)}`,
      entityType: 'user',
      entityId: String(id),
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updated,
    });
  } catch (err) {
    next(err);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const logs = await activityRepo.find(limit);

    res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUserStatus,
  getActivityLogs,
};
