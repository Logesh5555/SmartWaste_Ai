const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { userRepo, activityRepo } = require('../models/dataRepository');
const config = require('../config/config');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'staff', phone = '', assignedWard = 'Ward-1 Central Market' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
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

    const token = generateToken(user._id, user.role);

    await activityRepo.create({
      user: user._id,
      userName: user.name,
      action: `User registered with role ${user.role}`,
      entityType: 'user',
      entityId: String(user._id),
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedWard: user.assignedWard,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await userRepo.findByEmail(email, true);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    // Compare bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user._id, user.role);

    await activityRepo.create({
      user: user._id,
      userName: user.name,
      action: 'User logged in',
      entityType: 'user',
      entityId: String(user._id),
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedWard: user.assignedWard,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        assignedWard: user.assignedWard,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, assignedWard } = req.body;
    const updated = await userRepo.updateById(req.user._id || req.user.id, {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(assignedWard && { assignedWard }),
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
