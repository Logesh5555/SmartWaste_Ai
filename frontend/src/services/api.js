import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('econexa_token') || localStorage.getItem('smartwaste_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear if already on login/register
      const path = window.location.pathname;
      if (!path.includes('login') && !path.includes('register')) {
        localStorage.removeItem('econexa_token');
        localStorage.removeItem('econexa_user');
        localStorage.removeItem('smartwaste_token');
        localStorage.removeItem('smartwaste_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Bins endpoints
export const binsAPI = {
  getAll: (params) => api.get('/bins', { params }),
  getById: (id) => api.get(`/bins/${id}`),
  getHistory: (id, limit = 50) => api.get(`/bins/${id}/history`, { params: { limit } }),
  create: (data) => api.post('/bins', data),
  update: (id, data) => api.put(`/bins/${id}`, data),
  delete: (id) => api.delete(`/bins/${id}`),
};

// Monitoring & KPIs
export const monitoringAPI = {
  getKPIs: () => api.get('/monitoring/kpis'),
  ingestSensorReading: (data) => api.post('/monitoring/sensor-reading', data),
  getSimulatorStatus: () => api.get('/monitoring/simulator/status'),
  toggleSimulator: (action, intervalMs) => api.post('/monitoring/simulator/toggle', { action, intervalMs }),
  triggerStep: () => api.post('/monitoring/simulator/step'),
};

// AI Prediction endpoints
export const predictionAPI = {
  getBinPrediction: (binId) => api.get(`/predictions/bin/${binId}`),
  getAllPredictions: () => api.get('/predictions/all'),
  getModelMetrics: () => api.get('/predictions/metrics'),
};

// Collection Tasks & Routes
export const collectionAPI = {
  getTasks: (params) => api.get('/collection/tasks', { params }),
  getTaskById: (id) => api.get(`/collection/tasks/${id}`),
  previewOptimization: (binIds) => api.post('/collection/optimize', { binIds }),
  createTask: (data) => api.post('/collection/tasks', data),
  updateTaskStatus: (id, data) => api.put(`/collection/tasks/${id}/status`, data),
  reportIssue: (data) => api.post('/collection/report-issue', data),
};

// Alerts
export const alertsAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getSummary: () => api.get('/alerts/summary'),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
};

// Analytics & Reports
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  exportCSVUrl: (type = 'bins') => `${API_BASE_URL}/analytics/export-csv?type=${type}`,
};

// Users (Admin only)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  updateStatus: (id, data) => api.put(`/users/${id}/status`, data),
  getActivities: () => api.get('/users/activities'),
};

export default api;
