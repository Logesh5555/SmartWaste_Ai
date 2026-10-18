import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://localhost:5000'
    : undefined);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastBinUpdate, setLastBinUpdate] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [lastTaskUpdate, setLastTaskUpdate] = useState(null);
  const [simulatorStatus, setSimulatorStatus] = useState({ isRunning: false, intervalMs: 5000 });

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('Socket.IO connected to backend.');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('Socket.IO disconnected.');
      setIsConnected(false);
    });

    s.on('bin:updated', (data) => {
      setLastBinUpdate(data);
    });

    s.on('alert:new', (data) => {
      setLatestAlert(data);
    });

    s.on('task:updated', (data) => {
      setLastTaskUpdate(data);
    });

    s.on('simulator:status', (data) => {
      setSimulatorStatus(data);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastBinUpdate,
        latestAlert,
        clearLatestAlert: () => setLatestAlert(null),
        lastTaskUpdate,
        simulatorStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
