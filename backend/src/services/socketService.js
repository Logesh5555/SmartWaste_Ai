let io = null;

const initSocket = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);

    socket.on('subscribe_ward', (ward) => {
      socket.join(`ward:${ward}`);
      console.log(`Socket ${socket.id} joined ward room: ${ward}`);
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket client disconnected: ${socket.id}`);
    });
  });
};

const getIo = () => io;

const emitBinUpdate = (bin) => {
  if (io) {
    io.emit('bin:updated', bin);
    if (bin.ward) {
      io.to(`ward:${bin.ward}`).emit('bin:updated', bin);
    }
  }
};

const emitAlert = (alert) => {
  if (io) {
    io.emit('alert:new', alert);
  }
};

const emitTaskUpdate = (task) => {
  if (io) {
    io.emit('task:updated', task);
  }
};

const emitSimulatorStatus = (status) => {
  if (io) {
    io.emit('simulator:status', status);
  }
};

module.exports = {
  initSocket,
  getIo,
  emitBinUpdate,
  emitAlert,
  emitTaskUpdate,
  emitSimulatorStatus,
};
