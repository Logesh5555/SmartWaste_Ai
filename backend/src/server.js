const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const config = require('./config/config');
const { connectDB } = require('./config/db');
const { initSocket } = require('./services/socketService');
const { startSimulator } = require('./services/simulatorService');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const binRoutes = require('./routes/binRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const alertRoutes = require('./routes/alertRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
initSocket(io);

// Security and standard middlewares
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'EcoNexa - Intelligent Waste Prediction & Monitoring Engine',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bins', binRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Serve static frontend files if frontend/dist exists (All-in-One Deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // SPA fallback for non-API client routes
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// 404 handler for unmatched API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint not found: [${req.method}] ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDB();

    // Start background simulator
    startSimulator(config.simulatorIntervalMs);

    // Optionally spawn local Python ML service in background if present
    const mlDir = path.resolve(__dirname, '../../ml_service');
    if (fs.existsSync(path.join(mlDir, 'app.py'))) {
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      try {
        const mlProc = spawn(pythonCmd, ['-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '5001'], {
          cwd: mlDir,
          stdio: 'ignore',
          detached: true,
        });
        mlProc.unref();
      } catch (e) {
        // Fallback analytical prediction engine automatically handles predictions
      }
    }

    server.listen(config.port, () => {
      console.log(`======================================================`);
      console.log(` EcoNexa Backend Server running on port ${config.port}`);
      console.log(` Environment: ${config.nodeEnv}`);
      console.log(` WebSocket Telemetry: Active`);
      console.log(` ML Service URL: ${config.mlServiceUrl}`);
      console.log(`======================================================`);
    });
  } catch (err) {
    console.error('Server initialization error:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
