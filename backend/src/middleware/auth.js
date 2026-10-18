const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { userRepo } = require('../models/dataRepository');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await userRepo.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token is invalid or has expired.',
      error: err.message,
    });
  }
};

const verifySensorKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (!apiKey || apiKey !== config.iotApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized IoT device. Invalid or missing sensor API key.',
    });
  }
  next();
};

module.exports = {
  protect,
  verifySensorKey,
};
