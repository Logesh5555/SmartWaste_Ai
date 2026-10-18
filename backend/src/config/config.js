require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartwaste',
  jwtSecret: process.env.JWT_SECRET || 'smartwaste_super_secret_jwt_key_2026_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001',
  iotApiKey: process.env.IOT_API_KEY || 'iot_smartwaste_sensor_auth_key_8899',
  simulatorIntervalMs: parseInt(process.env.SIMULATOR_INTERVAL_MS || '5000', 10),
};
